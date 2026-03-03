import { strings, template } from './generated/shared.js'

type FetchImpl = typeof fetch
export type GhmdTheme = 'system' | 'light' | 'dark'
export type GhmdMode = 'gfm' | 'markdown'

const MARKDOWN_API_URL = 'https://api.github.com/markdown'

function assertTheme(theme: GhmdTheme) {
	if (!['system', 'light', 'dark'].includes(theme))
		throw new Error(
			`Invalid theme: ${theme}. Expected one of: system, light, dark.`,
		)
}

function assertMode(mode: GhmdMode) {
	if (!['gfm', 'markdown'].includes(mode))
		throw new Error(`Invalid mode: ${mode}. Expected one of: gfm, markdown.`)
}

/**
 * Extracts the first Markdown H1 (`# Title`) and uses it as a page title.
 * Returns `fallback` when no H1 is present.
 */
export function resolveTitle(markdown: string, fallback = '') {
	return markdown.match(/^# (.*)$/m)?.[1] ?? fallback
}

/**
 * Resolves the stylesheet URL for a given theme variant.
 * Uses the default (no suffix) stylesheet for `system`, and `-light` / `-dark` suffixes otherwise.
 */
export function getCssUri({ theme = 'system' }: { theme?: GhmdTheme } = {}) {
	assertTheme(theme)
	const themeSuffix = theme === 'system' ? '' : `-${theme}`
	return strings.css.uri.replace('{theme}', themeSuffix)
}

async function getEmbeddedCss(cssUri: string, fetchImpl: FetchImpl = fetch) {
	const res = await fetchImpl(cssUri)
	if (res.status !== 200) throw new Error(strings.errors.embedCss)
	return `<style>${await res.text()}</style>`
}

/**
 * Returns stylesheet markup for the selected theme.
 * By default it returns a `<link>` tag, and switches to inline `<style>` when `embedCss` is enabled.
 */
export async function getCss({
	theme = 'system',
	embedCss = false,
	fetchImpl = fetch,
}: {
	theme?: GhmdTheme
	embedCss?: boolean
	fetchImpl?: FetchImpl
} = {}) {
	const cssUri = getCssUri({ theme })
	return embedCss
		? await getEmbeddedCss(cssUri, fetchImpl)
		: strings.css.link.replace('{uri}', cssUri)
}

export interface GhmdRenderOptions {
	mode?: GhmdMode
	token?: string
	fetchImpl?: FetchImpl
}
/**
 * Converts Markdown to HTML through GitHub's `/markdown` API.
 * Optionally sends a bearer token and allows swapping the fetch implementation for custom runtimes or testing.
 */
export async function renderMarkdown(
	markdown: string,
	{ mode = 'gfm', token, fetchImpl = fetch }: GhmdRenderOptions = {},
) {
	assertMode(mode)

	const headers: Record<string, string> = {
		Accept: 'application/vnd.github+json',
		'Content-Type': 'application/json',
	}
	if (token) headers.Authorization = `Bearer ${token}`

	const res = await fetchImpl(MARKDOWN_API_URL, {
		method: 'POST',
		headers,
		body: JSON.stringify({ text: markdown, mode }),
	})

	if (res.status !== 200) throw new Error(strings.errors.markdownConversion)
	return await res.text()
}

export interface GhmdBuildOptions {
	markdown: string
	content: string
	css: string
	pageTitle?: string
	htmlTemplate?: string
}
/**
 * Injects rendered content, CSS, and title into the HTML template placeholders.
 * If `pageTitle` is not provided, it falls back to the first H1 found in the source markdown.
 */
export function buildHtml({
	markdown,
	content,
	css,
	pageTitle,
	htmlTemplate = template,
}: GhmdBuildOptions) {
	return htmlTemplate
		.replace('{{ .CSS }}', css)
		.replace('{{ .Title }}', pageTitle || resolveTitle(markdown))
		.replace('{{ .Content }}', content)
}

export interface GhmdConvertOptions extends GhmdRenderOptions {
	theme?: GhmdTheme
	embedCss?: boolean
	title?: string
}
/**
 * End-to-end Markdown to full HTML conversion.
 * Runs CSS resolution and Markdown rendering in parallel, then composes the final document.
 */
export async function convertMarkdownToHtml(
	markdown: string,
	options: GhmdConvertOptions = {},
) {
	const {
		theme = 'system',
		embedCss = false,
		mode = 'gfm',
		title = '',
	} = options

	const [css, content] = await Promise.all([
		getCss({ theme, embedCss, fetchImpl: options.fetchImpl }),
		renderMarkdown(markdown, {
			mode,
			token: options.token,
			fetchImpl: options.fetchImpl,
		}),
	])

	return buildHtml({
		markdown,
		content,
		css,
		pageTitle: title,
	})
}
