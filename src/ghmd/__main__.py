import json
import os
import re
import sys
import requests

help_message = """
Usage: ghmd [options] <file>...

Options:
    --dark              Use dark theme only
    --light             Use light theme only
    --embed-css         Embed the CSS into the HTML file instead of using the <link> tag
    --no-gfm            Use plain Markdown mode instead of GitHub Flavored Markdown (gfm)
    --help              Show this help message and exit

Full documentation: https://github.com/roman910dev/ghmd
"""

def main():
    files = [argv for argv in sys.argv[1:] if not argv.startswith("--")]
    options = [argv for argv in sys.argv[1:] if argv.startswith("--")]

    theme = ""
    embed_css = False
    mode = "gfm"

    for option in options:
        if option == "--help":
            return print(help_message)
        elif option == "--dark":
            theme = "-dark"
        elif option == "--light":
            theme = "-light"
        elif option == "--embed-css":
            embed_css = True
        elif option == "--no-gfm":
            mode = "markdown"
        else:
            raise Exception(f"Invalid option: {option}")

    if any(file.endswith(".html") for file in files):
        raise Exception(
            "File cannot have .html extension because it would be overwritten"
        )

    css_uri = (
        "https://cdnjs.cloudflare.com/ajax/libs/"
        f"github-markdown-css/5.8.1/github-markdown{theme}.min.css"
    )

    if embed_css:
        res = requests.get(css_uri)
        if res.status_code != 200:
            raise Exception(
                "Could not get css. "
                "Check your internet connection or try without --embed-css."
            )
        css = f"<style>{res.text}</style>"
    else:
        css = (
            "<link "
            'rel="stylesheet" '
            f'href="{css_uri}" '
            'crossorigin="anonymous" '
            'referrerpolicy="no-referrer" '
            "/>"
        )

    headers = {"Accept": "application/vnd.github+json"}
    if github_token := os.environ.get("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {github_token}"

    for file in files:
        file_content = open(file, "r", encoding="utf-8").read()

        titleSearch = re.search(r"^# (.*)$", file_content, re.MULTILINE)
        title = titleSearch.group(1) if titleSearch else ""

        dirname = os.path.dirname(__file__)
        template = open(os.path.join(dirname, "md-template.html"), "r").read()

        res = requests.post(
            "https://api.github.com/markdown",
            headers=headers,
            data=json.dumps({"text": file_content, "mode": mode}),
        )

        if res.status_code != 200:
            raise Exception(
                "Could not convert markdown to HTML. Check your internet connection."
            )

        filename = ".".join(file.split(".")[:-1])
        with open(f"{filename}.html", "w+", encoding="utf-8") as f:
            f.write(
                template.replace("{{ .CSS }}", css)
                .replace("{{ .Title }}", title)
                .replace("{{ .Content }}", res.text)
            )


if __name__ == "__main__":
    main()
