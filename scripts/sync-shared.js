import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const sharedDir = path.join(root, 'src/shared')
const sharedDirs = ['src/python/src/ghmd/shared'].map((dir) =>
	path.join(root, dir),
)
const genDirs = ['src/node/src/generated', 'src/browser/src/generated'].map(
	(dir) => path.join(root, dir),
)

const stringsPath = path.join(sharedDir, 'strings.json')
const templatePath = path.join(sharedDir, 'md-template.html')

const dirs = [...sharedDirs, ...genDirs]

for (const dir of dirs) {
	rmSync(dir, { recursive: true, force: true })
	mkdirSync(dir, { recursive: true })
}

for (const dir of sharedDirs) cpSync(sharedDir, dir, { recursive: true })

const strings = JSON.parse(readFileSync(stringsPath, 'utf-8'))
const template = readFileSync(templatePath, 'utf-8')
const source = [
	`export const strings = ${JSON.stringify(strings, null, 2)}`,
	`export const template = ${JSON.stringify(template)}`,
].join('\n\n')

for (const dir of genDirs) writeFileSync(path.join(dir, 'shared.ts'), source)
