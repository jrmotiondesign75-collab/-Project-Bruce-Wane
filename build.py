#!/usr/bin/env python3
"""Bundle the app into one HTML page (dist/courtside.html) for publishing as a Claude artifact.

The artifact host wraps the page in its own <html>/<head>/<body>, so the output
starts with <title> and <style> and inlines every script.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
MODULES = ["js/drills.js", "js/data.js", "js/engine.js", "js/cloud.js", "js/app.js"]


def strip_module_syntax(src: str) -> str:
    src = re.sub(r"^import [\s\S]*?;\n", "", src, flags=re.M)
    return re.sub(r"^export ", "", src, flags=re.M)


def main() -> None:
    css = (ROOT / "styles.css").read_text()
    js = "\n".join(strip_module_syntax((ROOT / m).read_text()) for m in MODULES)
    html = (ROOT / "index.html").read_text()
    body = html.split("<body>")[1].split("<script")[0]
    fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com[^"]+)"', html).group(1)
    page = f"""<title>Courtside</title>
<link rel="stylesheet" href="{fonts}">
<style>
{css}
</style>
{body}<script type="module">
{js}
</script>
"""
    out = ROOT / "dist" / "courtside.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(page)
    print(f"Wrote {out} ({len(page) // 1024} KB)")


if __name__ == "__main__":
    main()
