import { useMemo, useState } from 'react'
import strings from '../shared/strings.json'
import template from '../shared/md-template.html?raw'

const optionDescriptionByName = Object.fromEntries(
  strings.help.options.map(({ name, description }) => [name, description]),
)

const readText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsText(file)
  })

const getTitle = (text, fallback) => text.match(/^# (.*)$/m)?.[1] ?? fallback

export function App() {
  const [markdown, setMarkdown] = useState('# Hello from ghmd browser\n')
  const [filename, setFilename] = useState('document.md')
  const [theme, setTheme] = useState('')
  const [embedCss, setEmbedCss] = useState(false)
  const [mode, setMode] = useState('gfm')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const cssUri = useMemo(() => strings.css.uri.replace('{theme}', theme), [theme])

  async function onFileUpload(event) {
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

      const css = embedCss
        ? `<style>${await (await fetch(cssUri)).text()}</style>`
        : strings.css.link.replace('{uri}', cssUri)

      const markdownResponse = await fetch('https://api.github.com/markdown', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: markdown, mode }),
      })

      if (!markdownResponse.ok) {
        throw new Error('Could not convert markdown to HTML.')
      }

      const html = template
        .replace('{{ .CSS }}', css)
        .replace('{{ .Title }}', getTitle(markdown, 'ghmd browser'))
        .replace('{{ .Content }}', await markdownResponse.text())

      const htmlBlob = new Blob([html], { type: 'text/html' })
      const htmlUrl = URL.createObjectURL(htmlBlob)
      const anchor = document.createElement('a')
      anchor.href = htmlUrl
      anchor.download = `${filename.replace(/\.[^/.]+$/, '') || 'document'}.html`
      anchor.click()
      URL.revokeObjectURL(htmlUrl)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Unknown error.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <h1>ghmd browser</h1>
      <p>Drop markdown in, download html out.</p>

      <input type="file" accept=".md,.markdown,text/markdown,text/plain" onChange={onFileUpload} />

      <textarea
        value={markdown}
        onChange={(event) => setMarkdown(event.target.value)}
        placeholder="Write markdown here..."
      />

      <div className="row">
        <label>
          Theme
          <select value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="">System</option>
            <option value="-light">Light</option>
            <option value="-dark">Dark</option>
          </select>
          <small>{`${optionDescriptionByName['--light']} / ${optionDescriptionByName['--dark']}`}</small>
        </label>

        <label>
          Mode
          <select value={mode} onChange={(event) => setMode(event.target.value)}>
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
    </main>
  )
}
