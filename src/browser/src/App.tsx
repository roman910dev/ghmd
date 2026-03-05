import type { GhmdMode, GhmdTheme } from 'ghmd-js'
import { convertMarkdownToHtml } from 'ghmd-js'
import type { ChangeEvent } from 'react'
import { useState } from 'react'
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

	async function onFileUpload(event: ChangeEvent<HTMLInputElement>) {
		const [file] = event.target.files ?? []
		if (!file) return

		try {
			setError('')
			setFilename(file.name)
			setMarkdown(await readText(file))
		} catch {
			setError('Could not read markdown file.')
		}
	}

	async function onConvert() {
		try {
			setBusy(true)
			setError('')
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
			URL.revokeObjectURL(htmlUrl)
		} catch (currentError) {
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
				<label htmlFor="theme-select">
					Theme
					<select
						id="theme-select"
						value={theme}
						onChange={(event) => setTheme(event.target.value as GhmdTheme)}
					>
						<option value="system">System</option>
						<option value="light">Light</option>
						<option value="dark">Dark</option>
					</select>
					<small>{`${optionDescriptionByName['--light']} / ${optionDescriptionByName['--dark']}`}</small>
				</label>

				<label htmlFor="mode-select">
					Mode
					<select
						id="mode-select"
						value={mode}
						onChange={(event) => setMode(event.target.value as GhmdMode)}
					>
						<option value="gfm">GitHub Flavored Markdown</option>
						<option value="markdown">Plain markdown (--no-gfm)</option>
					</select>
					<small>{optionDescriptionByName['--no-gfm']}</small>
				</label>

				<label className="inline">
					<input
						type="checkbox"
						checked={embedCss}
						onChange={(event) => setEmbedCss(event.target.checked)}
					/>
					<span>
						Embed CSS
						<small>{optionDescriptionByName['--embed-css']}</small>
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
