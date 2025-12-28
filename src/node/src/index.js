#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const strings = JSON.parse(getShared('strings.json'))

function getShared(filename) {
	const dirname = path.dirname(fileURLToPath(import.meta.url))
	return readFileSync(path.join(dirname, '../shared', filename), 'utf-8')
}

async function getEmbeddedCss(cssUri) {
	const res = await fetch(cssUri)
	if (res.status !== 200) throw new Error(strings.errors.embedCss)
	return `<style>${await res.text()}</style>`
}

async function main() {
	const files = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
	const options = process.argv.slice(2).filter((arg) => arg.startsWith('--'))

	let theme = ''
	let embedCss = false
	let mode = 'gfm'

	for (const option of options) {
		if (option === '--help') return console.log(strings.helpMessage.join('\n'))
		else if (option === '--dark') theme = '-dark'
		else if (option === '--light') theme = '-light'
		else if (option === '--embed-css') embedCss = true
		else if (option === '--no-gfm') mode = 'markdown'
		else
			throw new Error(strings.errors.invalidOption.replace('{option}', option))
	}

	if (files.some((file) => file.endsWith('.html')))
		throw new Error(strings.errors.htmlExtension)

	const cssUri = strings.css.uri.replace('{theme}', theme)

	const css = embedCss
		? await getEmbeddedCss(cssUri)
		: [strings.css.link.replace('{uri}', cssUri)].join(' ')

	const headers = {
		Accept: 'application/vnd.github+json',
		Authorization:
			process.env.GITHUB_TOKEN && `Bearer ${process.env.GITHUB_TOKEN}`,
	}

	for (const file of files) {
		const fileContent = readFileSync(file, 'utf-8')

		const title = fileContent.match(/^# (.*)$/m)?.[1] ?? ''

		const template = getShared('md-template.html')

		const res = await fetch('https://api.github.com/markdown', {
			method: 'POST',
			headers,
			body: JSON.stringify({ text: fileContent, mode }),
		})

		if (res.status !== 200) throw new Error(strings.errors.markdownConversion)

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
