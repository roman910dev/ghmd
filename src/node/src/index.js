import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const helpMessage = `
Usage: ghmd [options] <file>...

Options:
    --dark              Use dark theme only
    --light             Use light theme only
    --embed-css         Embed the CSS into the HTML file instead of using the <link> tag
    --no-gfm            Use plain Markdown mode instead of GitHub Flavored Markdown (gfm)
    --help              Show this help message and exit

Full documentation: https://github.com/roman910dev/ghmd
`

async function getEmbeddedCss(cssUri) {
	const res = await fetch(cssUri)
	if (res.status !== 200)
		throw new Error(
			'Could not get css. Check your internet connection or try without --embed-css.',
		)
	return `<style>${await res.text()}</style>`
}

async function main() {
	const files = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
	const options = process.argv.slice(2).filter((arg) => arg.startsWith('--'))

	let theme = ''
	let embedCss = false
	let mode = 'gfm'

	for (const option of options) {
		if (option === '--help') return console.log(helpMessage)
		else if (option === '--dark') theme = '-dark'
		else if (option === '--light') theme = '-light'
		else if (option === '--embed-css') embedCss = true
		else if (option === '--no-gfm') mode = 'markdown'
		else throw new Error(`Invalid option: ${option}`)
	}

	if (files.some((file) => file.endsWith('.html')))
		throw new Error(
			'File cannot have .html extension because it would be overwritten',
		)

	const cssUri = `https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown${theme}.min.css`

	const css = embedCss
		? await getEmbeddedCss(cssUri)
		: [
				'<link',
				'rel="stylesheet"',
				`href="${cssUri}"`,
				`crossorigin="anonymous"`,
				`referrerpolicy="no-referrer"`,
				'/>',
			].join(' ')

	const headers = {
		Accept: 'application/vnd.github+json',
		Authorization:
			process.env.GITHUB_TOKEN && `Bearer ${process.env.GITHUB_TOKEN}`,
	}

	for (const file of files) {
		const fileContent = readFileSync(file, 'utf-8')

		const title = fileContent.match(/^# (.*)$/m)?.[1] ?? ''

		const dirname = path.dirname(fileURLToPath(import.meta.url))
		const templatePath = path.join(dirname, '../shared/md-template.html')
		const template = readFileSync(templatePath, 'utf-8')

		const res = await fetch('https://api.github.com/markdown', {
			method: 'POST',
			headers,
			body: JSON.stringify({ text: fileContent, mode }),
		})

		if (res.status !== 200)
			throw new Error(
				'Could not convert markdown to HTML. Check your internet connection.',
			)

		const filename = `${file.split('.').slice(0, -1).join('.')}.html`
		writeFileSync(
			filename,
			template
				.replace('{{ .CSS }}', css)
				.replace('{{ .Title }}', title)
				.replace('{{ .Content }}', await res.text()),
		)
	}
}

if (import.meta.url === `file://${process.argv[1]}`) main()
