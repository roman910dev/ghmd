import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cli = path.join(__dirname, '../src/python/venv/bin/ghmd')

const run = (...args) => {
	const res = execSync(`${cli} ${args.join(' ')}`).toString()
	console.log(res)
	return res
}

describe('ghmd', () => {
	it('should show help message', () => {
		expect(run('--help')).toContain('Usage: ghmd [options] <file>...')
	})
})
