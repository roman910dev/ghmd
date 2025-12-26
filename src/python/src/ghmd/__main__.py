import json
import os
import re
import sys
import requests


def getShared(filename):
    filePath = os.path.join(os.path.dirname(__file__), "../../shared", filename)
    return open(filePath, "r").read()


strings = json.loads(getShared("strings.json"))


def main():
    files = [argv for argv in sys.argv[1:] if not argv.startswith("--")]
    options = [argv for argv in sys.argv[1:] if argv.startswith("--")]

    theme = ""
    embed_css = False
    mode = "gfm"

    for option in options:
        if option == "--help":
            return print("\n".join(strings["helpMessage"]))
        elif option == "--dark":
            theme = "-dark"
        elif option == "--light":
            theme = "-light"
        elif option == "--embed-css":
            embed_css = True
        elif option == "--no-gfm":
            mode = "markdown"
        else:
            raise Exception(strings["errors"]["invalidOption"].format(option=option))

    if any(file.endswith(".html") for file in files):
        raise Exception(strings["errors"]["htmlExtension"])

    css_uri = strings["css"]["uri"].format(theme=theme)

    if embed_css:
        res = requests.get(css_uri)
        if res.status_code != 200:
            raise Exception(strings["errors"]["embedCss"])
        css = f"<style>{res.text}</style>"
    else:
        css = strings["css"]["link"].format(uri=css_uri)

    headers = {"Accept": "application/vnd.github+json"}
    if github_token := os.environ.get("GITHUB_TOKEN"):
        headers["Authorization"] = f"Bearer {github_token}"

    for file in files:
        file_content = open(file, "r", encoding="utf-8").read()

        titleSearch = re.search(r"^# (.*)$", file_content, re.MULTILINE)
        title = titleSearch.group(1) if titleSearch else ""

        template = getShared("md-template.html")

        res = requests.post(
            "https://api.github.com/markdown",
            headers=headers,
            data=json.dumps({"text": file_content, "mode": mode}),
        )

        if res.status_code != 200:
            raise Exception(strings["errors"]["markdownConversion"])

        filename = ".".join(file.split(".")[:-1])
        with open(f"{filename}.html", "w+", encoding="utf-8") as f:
            f.write(
                template.replace("{{ .CSS }}", css)
                .replace("{{ .Title }}", title)
                .replace("{{ .Content }}", res.text)
            )


if __name__ == "__main__":
    main()
