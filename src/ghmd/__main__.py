import json
import os
import re
import sys
import requests


def main():
    files = [argv for argv in sys.argv[1:] if not argv.startswith('--')]

    theme = (
        '-dark' if '--dark' in sys.argv else
        '-light' if '--light' in sys.argv else
        ''
    )

    embed_css = '--embed-css' in sys.argv

    mode = 'markdown' if '--no-gfm' in sys.argv else 'gfm'

    if any(file.endswith('.html') for file in files):
        raise Exception(
            'File cannot have .html extension because it would be overwritten')

    css_uri = (
        'https://cdnjs.cloudflare.com/ajax/libs/'
        f'github-markdown-css/5.5.0/github-markdown{theme}.min.css'
    )

    if embed_css:
        res = requests.get(css_uri)
        if res.status_code != 200:
            raise Exception(
                'Could not get css. '
                'Check your internet connection or try without --embed-css.'
            )
        css = f'<style>{res.text}</style>'
    else:
        css = (
            '<link '
            'rel="stylesheet" '
            f'href="{css_uri}" '
            'crossorigin="anonymous" '
            'referrerpolicy="no-referrer" '
            '/>'
        )

    for file in files:
        file_content = open(file, 'r').read()

        titleSearch = re.search(r'^# (.*)$', file_content, re.MULTILINE)
        title = titleSearch.group(1) if titleSearch else ''

        dirname = os.path.dirname(__file__)
        template = open(os.path.join(dirname, 'md-template.html'), 'r').read()

        res = requests.post('https://api.github.com/markdown',
                            headers={'Accept': 'application/vnd.github+json'},
                            data=json.dumps({
                                'text': file_content,
                                'mode': mode
                            }))

        if res.status_code != 200:
            raise Exception(
                'Could not convert markdown to HTML. '
                'Check your internet connection.'
            )

        filename = '.'.join(file.split('.')[:-1])
        with open(f'{filename}.html', 'w+') as f:
            f.write(
                template
                .replace('{{ .CSS }}', css)
                .replace('{{ .Title }}', title)
                .replace('{{ .Content }}', res.text)
            )


if __name__ == '__main__':
    main()
