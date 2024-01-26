# ghmd

ghmd (GitHub Markdown) is an extremely light-weight and simple command line tool to convert GitHub Flavored Markdown to HTML.

It does so by using the [GitHub Markdown API](https://docs.github.com/en/free-pro-team@latest/rest/reference/markdown) in combination with [GitHub Markdown CSS](https://github.com/sindresorhus/github-markdown-css).

## Installation

```bash
pip install ghmd
```

## Usage

Simply run `ghmd` with the path to the markdown file(s) you want to convert. An HTML file will be created in the same directory as the markdown file with the same filename.

```bash
ghmd README.md
# or
ghmd README.md CONTRIBUTING.md
```

> [!NOTE]
> If you don't have the `ghmd` command available after installing, you may need to add the Python scripts directory to your PATH environment variable. 
> 
> Otherwise you, can use `python -m ghmd` instead of `ghmd`.

## Options

By default, ghmd will add the remote CSS as a `<link>` tag in the HTML file. If you want to embed the CSS directly into the HTML file so that, for example, you can send the HTML file to someone else and they can view it without an internet connection, you can use the `--embed-css` option.

```bash
ghmd README.md --embed-css
```

The default CSS styles adapt to the system's dark mode setting of the reader. If you want to force the CSS to be light or dark, you can use the `--light` or `--dark` options.

```bash
ghmd README.md --light
# or
ghmd README.md --dark
```

Both `--light` and `--dark` can be used in combination with `--embed-css`.

> [!NOTE]
> Using the `--embed-css` option will result in a ~25 KB larger HTML file size (~18 KB if using `--light` or `--dark`).