#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { strings } from './generated/shared.js'
import type { GhmdMode, GhmdTheme } from './index.js'
import { convertMarkdownToHtml, formatHelpMessage } from './index.js'

interface ParsedCliArguments {
	files: string[]
	help: boolean
	theme: GhmdTheme
	embedCss: boolean
	mode: GhmdMode
}

function parseCliArguments(args: string[]): ParsedCliArguments {
	const files = args.filter((arg) => !arg.startsWith('--'))
	const options = args.filter((arg) => arg.startsWith('--'))

	let theme: GhmdTheme = 'system'
	let embedCss = false
	let mode: GhmdMode = 'gfm'
	let help = false

	for (const option of options) {
		if (option === '--help') help = true
		else if (option === '--dark') theme = 'dark'
		else if (option === '--light') theme = 'light'
		else if (option === '--embed-css') embedCss = true
		else if (option === '--no-gfm') mode = 'markdown'
		else
			throw new Error(strings.errors.invalidOption.replace('{option}', option))
	}

	return { files, help, theme, embedCss, mode }
}

async function convertFile(
	inputPath: string,
	options: { theme: GhmdTheme; embedCss: boolean; mode: GhmdMode },
) {
	if (inputPath.endsWith('.html')) throw new Error(strings.errors.htmlExtension)

	const markdown = readFileSync(inputPath, 'utf-8')
	const html = await convertMarkdownToHtml(markdown, {
		...options,
		token: process.env.GITHUB_TOKEN,
	})
	const outputPath = `${inputPath.split('.').slice(0, -1).join('.') || inputPath}.html`

	writeFileSync(outputPath, html)
	return outputPath
}

async function main() {
	const { files, help, theme, embedCss, mode } = parseCliArguments(
		process.argv.slice(2),
	)

	if (help) return console.log(formatHelpMessage())

	for (const file of files) await convertFile(file, { theme, embedCss, mode })
}

main()
