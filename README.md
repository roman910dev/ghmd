# ghmd

ghmd (GitHub Markdown) is an extremely light-weight and simple command line tool to convert GitHub Flavored Markdown (or [plain Markdown](#no-gfm)) to HTML.

It does so by using the [GitHub Markdown API](https://docs.github.com/en/free-pro-team@latest/rest/reference/markdown) in combination with [GitHub Markdown CSS](https://github.com/sindresorhus/github-markdown-css).

It has two available implementations:

-   [Python](https://pypi.org/project/ghmd/)
-   [Node.js](https://www.npmjs.com/package/ghmd-js)
  
## Installation

```bash
# Node.js
npm install -g ghmd-js
```

or

```bash
# Python
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

### GitHub API Token

By default, ghmd uses unauthenticated requests to the GitHub API, which has a rate limit of 60 requests per hour. To increase this limit to 5000 requests per hour, you can set the `GITHUB_TOKEN` environment variable with a GitHub personal access token:

```bash
export GITHUB_TOKEN=your_github_token_here
ghmd README.md
```

To create a personal access token, visit your [GitHub Settings > Developer Settings > Personal access tokens](https://github.com/settings/tokens) and create a new token (no specific scopes are required).

### `--embed-css`

By default, ghmd will add the remote CSS as a `<link>` tag in the HTML file. If you want to embed the CSS directly into the HTML file so that, for example, you can send the HTML file to someone else and they can view it without an internet connection, you can use the `--embed-css` option.

```bash
ghmd README.md --embed-css
```

### `--light` and `--dark`

The default CSS styles adapt to the system's dark mode setting of the reader. If you want to force the CSS to be light or dark, you can use the `--light` or `--dark` options.

```bash
ghmd README.md --light
# or
ghmd README.md --dark
```

Both `--light` and `--dark` can be used in combination with `--embed-css`.

> [!NOTE]
> Using the `--embed-css` option will result in a ~25 KB larger HTML file size (~18 KB when using `--light` or `--dark`).

### `--no-gfm`

The tool offers two modes: GitHub Flavored Markdown (gfm, default) and plain Markdown. To use the latter, the `--no-gfm` option can be used:

```bash
ghmd README.md --no-gfm
```
