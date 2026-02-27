import strings from '../../shared/strings.json'
import template from '../../shared/md-template.html?raw'

const markdownInput = document.querySelector('#markdownInput')
const fileInput = document.querySelector('#fileInput')
const noGfm = document.querySelector('#noGfm')
const embedCss = document.querySelector('#embedCss')
const themeSelect = document.querySelector('#theme')
const downloadButton = document.querySelector('#downloadButton')
const status = document.querySelector('#status')

function setStatus(message) {
	status.textContent = message
}

async function getCssTag() {
	const cssUri = strings.css.uri.replace('{theme}', themeSelect.value)

	if (!embedCss.checked)
		return strings.css.link.replace('{uri}', cssUri)

	const res = await fetch(cssUri)
	if (res.status !== 200) throw new Error(strings.errors.embedCss)
	return `<style>${await res.text()}</style>`
}

async function convertMarkdown(markdown, mode) {
	const headers = {
		Accept: 'application/vnd.github+json',
	}

	const githubToken = localStorage.getItem('GITHUB_TOKEN')
	if (githubToken) headers.Authorization = `Bearer ${githubToken}`

	const res = await fetch('https://api.github.com/markdown', {
		method: 'POST',
		headers,
		body: JSON.stringify({ text: markdown, mode }),
	})

	if (res.status !== 200) throw new Error(strings.errors.markdownConversion)

	return res.text()
}

fileInput.addEventListener('change', async (event) => {
	const [file] = event.target.files
	if (!file) return
	markdownInput.value = await file.text()
	setStatus(`Loaded ${file.name}`)
})

downloadButton.addEventListener('click', async () => {
	try {
		const markdown = markdownInput.value
		if (!markdown.trim()) {
			setStatus('Please write or upload markdown first.')
			return
		}

		setStatus('Converting...')

		const htmlContent = await convertMarkdown(
			markdown,
			noGfm.checked ? 'markdown' : 'gfm',
		)
		const css = await getCssTag()
		const title = markdown.match(/^# (.*)$/m)?.[1] ?? ''
		const output = template
			.replace('{{ .CSS }}', css)
			.replace('{{ .Title }}', title)
			.replace('{{ .Content }}', htmlContent)

		const blob = new Blob([output], { type: 'text/html' })
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = 'document.html'
		link.click()
		URL.revokeObjectURL(url)

		setStatus('Downloaded document.html')
	} catch (error) {
		setStatus(error.message)
	}
})
