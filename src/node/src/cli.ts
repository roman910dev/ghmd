#!/usr/bin/env node

import {
	convertFile,
	formatHelpMessage,
	type GhmdMode,
	type GhmdTheme,
	strings,
} from './index.js'

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

async function main() {
	const { files, help, theme, embedCss, mode } = parseCliArguments(
		process.argv.slice(2),
	)

	if (help) return console.log(formatHelpMessage())

	for (const file of files) await convertFile(file, { theme, embedCss, mode })
}

main()
