import type { GhmdMode, GhmdTheme } from 'ghmd-js'
import { convertMarkdownToHtml } from 'ghmd-js'
import type { ChangeEvent } from 'react'
import { useEffect, useState } from 'react'
import { initAnalytics, trackEvent } from './analytics'
import { strings } from './generated/shared'

const optionDescriptionByName = Object.fromEntries(
	strings.help.options.map(({ name, description }) => [name, description]),
)

const readText = (file: Blob): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result))
		reader.onerror = () => reject(new Error('Could not read file.'))
		reader.readAsText(file)
	})

export function App() {
	const [markdown, setMarkdown] = useState('# Hello from ghmd browser\n')
	const [filename, setFilename] = useState('document.md')
	const [theme, setTheme] = useState<GhmdTheme>('system')
	const [embedCss, setEmbedCss] = useState(false)
	const [mode, setMode] = useState<GhmdMode>('gfm')
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		initAnalytics()
	}, [])

	async function onFileUpload(event: ChangeEvent<HTMLInputElement>) {
		const [file] = event.target.files ?? []
		if (!file) return

		try {
			setError('')
			setFilename(file.name)
			setMarkdown(await readText(file))
			trackEvent('markdown_file_uploaded', {
				file_extension: file.name.split('.').pop()?.toLowerCase() || 'unknown',
				file_size_bytes: file.size,
			})
		} catch {
			setError('Could not read markdown file.')
			trackEvent('markdown_file_upload_failed')
		}
	}

	async function onConvert() {
		try {
			setBusy(true)
			setError('')
			trackEvent('convert_clicked', {
				theme,
				mode,
				embed_css: embedCss,
				markdown_length: markdown.length,
			})
			const html = await convertMarkdownToHtml(markdown, {
				theme,
				embedCss,
				mode,
				title: 'ghmd browser',
			})

			const htmlBlob = new Blob([html], { type: 'text/html' })
			const htmlUrl = URL.createObjectURL(htmlBlob)
			const anchor = document.createElement('a')
			anchor.href = htmlUrl
			anchor.download = `${filename.replace(/\.[^/.]+$/, '') || 'document'}.html`
			anchor.click()
			trackEvent('convert_succeeded', {
				theme,
				mode,
				embed_css: embedCss,
				output_filename: anchor.download,
			})
			URL.revokeObjectURL(htmlUrl)
		} catch (currentError) {
			trackEvent('convert_failed', {
				theme,
				mode,
				embed_css: embedCss,
				error_message:
					currentError instanceof Error ? currentError.message : 'Unknown error.',
			})
			setError(
				currentError instanceof Error ? currentError.message : 'Unknown error.',
			)
		} finally {
			setBusy(false)
		}
	}

	return (
		<section className="tool" aria-labelledby="converter-title">
			<h2 id="converter-title">Convert markdown</h2>
			<p className="tagline">Drop markdown in, download HTML out.</p>

			<label htmlFor="markdown-file">Upload markdown file</label>
			<input
				id="markdown-file"
				type="file"
				accept=".md,.markdown,text/markdown,text/plain"
				onChange={onFileUpload}
			/>

			<label htmlFor="markdown-input">Markdown input</label>
			<textarea
				id="markdown-input"
				value={markdown}
				onChange={(event) => setMarkdown(event.target.value)}
				placeholder="Write markdown here..."
			/>

			<div className="row">
				<label htmlFor="theme-select" className="option-field">
					<span className="option-label">Theme</span>
					<select
						id="theme-select"
						value={theme}
						onChange={(event) => setTheme(event.target.value as GhmdTheme)}
					>
						<option value="system">System</option>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
					</select>
					<small className="field-help">{`${optionDescriptionByName['--light']} / ${optionDescriptionByName['--dark']}`}</small>
				</label>

				<label htmlFor="mode-select" className="option-field">
					<span className="option-label">Mode</span>
					<select
						id="mode-select"
						value={mode}
						onChange={(event) => setMode(event.target.value as GhmdMode)}
					>
						<option value="gfm">GitHub Flavored Markdown</option>
						<option value="markdown">Plain markdown (--no-gfm)</option>
					</select>
					<small className="field-help">{optionDescriptionByName['--no-gfm']}</small>
				</label>

				<label className="option-field inline">
					<input
						type="checkbox"
						checked={embedCss}
						onChange={(event) => setEmbedCss(event.target.checked)}
					/>
					<span>
						<span className="option-label">Embed CSS</span>
						<small className="field-help">{optionDescriptionByName['--embed-css']}</small>
					</span>
				</label>
			</div>

			<button type="button" onClick={onConvert} disabled={busy}>
				{busy ? 'Converting...' : 'Convert and download HTML'}
			</button>

			{error && <p className="error">{error}</p>}
		</section>
	)
}
