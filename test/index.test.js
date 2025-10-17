import { execSync } from 'node:child_process'
import { cpSync, readFileSync, unlinkSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cli = path.join(__dirname, '../src/python/venv/bin/ghmd')
const fixture = path.join(__dirname, 'fixture.md')
const options = [
	['', '--light', '--dark'],
	['', '--embed-css'],
	['', '--no-gfm'],
]
const generateCombinations = (options, d = 0) =>
	options[d]?.flatMap((o) =>
		generateCombinations(options, d + 1).map((c) => [o, ...c]),
	) ?? [[]]
const combinations = generateCombinations(options)

const testCases = combinations.map((combination) => ({
	name: `fixture${combination.join('').replaceAll('--', '-')}.md`,
	combination,
}))

const outputPath = (name) => path.join(__dirname, 'output', name)

const run = (...args) => {
	const res = execSync(`${cli} ${args.join(' ')}`).toString()
	console.log(res)
	return res
}

describe('ghmd', () => {
	describe('misc', () => {
		it('should show help message', () => {
			expect(run('--help')).toContain('Usage: ghmd [options] <file>...')
		})

		it('should fail on unexpected option', () => {
			expect(() => run('--unexpected')).toThrow('Invalid option: --unexpected')
		})

		it('should prevent being used on html files', () => {
			expect(() => run('fixture.html')).toThrow(
				'File cannot have .html extension because it would be overwritten',
			)
		})
	})

	describe('conversion', () => {
		describe.each(testCases)(
			'options: $name',
			async ({ name, combination }) => {
				it('should convert markdown to html', async () => {
					const file = outputPath(name)
					cpSync(fixture, file)
					run(file, ...combination)
					unlinkSync(file)
					const expectedFile = path.join(__dirname, 'expected', name)
					const [actual, expected] = await Promise.all(
						[file, expectedFile].map((f) =>
							readFile(f.replace(/\.md$/, '.html'), 'utf-8').then((v) =>
								v
									.replaceAll(/user-content-fn-1-\w+/g, 'user-content-fn-1-x')
									.replaceAll(
										/user-content-fnref-1-\w+/g,
										'user-content-fnref-1-x',
									),
							),
						),
					)
					expect(actual).toBe(expected)
				})

				it('should have extracted title', () => {
					const file = outputPath(name).replace(/\.md$/, '.html')
					const title = readFileSync(file, 'utf-8').match(
						/<title>(.*)<\/title>/,
					)?.[1]
					expect(title).toBe('H1')
				})
			},
		)
	})
})
