#!/usr/bin/env python3
"""Bundle the app into one HTML page (dist/courtside.html) for publishing as a Claude artifact.

The artifact host wraps the page in its own <html>/<head>/<body>, so the output
starts with <title> and <style> and inlines every script.
"""
import argparse
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
MODULES = ["js/drills.js", "js/lessons.js", "js/data.js", "js/engine.js", "js/cloud.js", "js/app.js"]


def strip_module_syntax(src: str) -> str:
    src = re.sub(r"^import [\s\S]*?;\n", "", src, flags=re.M)
    return re.sub(r"^export ", "", src, flags=re.M)


THEMES = {
    "game": {"css": [], "title": "Courtside", "out": "courtside.html", "fonts": True, "config": None},
    "premium": {"css": ["theme-premium.css"], "title": "Courtside Premium", "out": "courtside-premium.html", "fonts": False, "config": {"social": False, "appearance": "light"}},
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--theme", choices=THEMES, default="game", help="visual theme to bundle (default: game)")
    theme = THEMES[parser.parse_args().theme]
    css = "\n".join((ROOT / f).read_text() for f in ["styles.css", *theme["css"]])
    js = "\n".join(strip_module_syntax((ROOT / m).read_text()) for m in MODULES)
    html = (ROOT / "index.html").read_text()
    body = html.split("<body>")[1].split("<script")[0]
    fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com[^"]+)"', html).group(1)
    config_script = f"<script>window.COURTSIDE = {json.dumps(theme['config'])};</script>\n" if theme["config"] else ""
    font_link = f'<link rel="stylesheet" href="{fonts}">\n' if theme["fonts"] else ""
    page = f"""<title>{theme["title"]}</title>
{font_link}<style>
{css}
</style>
{body}{config_script}<script type="module">
{js}
</script>
"""
    out = ROOT / "dist" / theme["out"]
    out.parent.mkdir(exist_ok=True)
    out.write_text(page)
    print(f"Wrote {out} ({len(page) // 1024} KB)")


if __name__ == "__main__":
    main()
