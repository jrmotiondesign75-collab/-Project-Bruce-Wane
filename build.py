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
MODULES = ["js/drills.js", "js/lessons.js", "js/data.js", "js/trivia.js", "js/billing.js", "js/engine.js", "js/cloud.js", "js/app.js"]


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
    parser.add_argument("--billing", choices=["off", "demo", "stripe"], default="off",
                        help="paywall: off (free), demo (practice checkout, no charge) or stripe (real checkout via --api)")
    parser.add_argument("--api", default="", help="billing server URL for --billing stripe, e.g. https://courtside-billing.vercel.app")
    parser.add_argument("--price", default="$5.99", help="price shown on the paywall (must match the Stripe price)")
    parser.add_argument("--trial-days", type=int, default=7, help="free trial length shown on the paywall, 0 for none (must match the server's TRIAL_DAYS)")
    parser.add_argument("--terms", default="", help="terms of service URL shown on the paywall")
    parser.add_argument("--privacy", default="", help="privacy policy URL shown on the paywall")
    args = parser.parse_args()
    if args.billing == "stripe" and not args.api:
        parser.error("--billing stripe needs --api (the URL where the /api billing functions are deployed)")
    theme = THEMES[args.theme]
    config = dict(theme["config"] or {})
    if args.billing != "off":
        config["billing"] = {"mode": args.billing, "api": args.api, "price": args.price, "period": "month",
                             "trialDays": args.trial_days, "terms": args.terms, "privacy": args.privacy}
    css = "\n".join((ROOT / f).read_text() for f in ["styles.css", *theme["css"]])
    js = "\n".join(strip_module_syntax((ROOT / m).read_text()) for m in MODULES)
    html = (ROOT / "index.html").read_text()
    body = html.split("<body>")[1].split("<script")[0]
    fonts = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com[^"]+)"', html).group(1)
    config_script = f"<script>window.COURTSIDE = {json.dumps(config)};</script>\n" if config else ""
    font_link = f'<link rel="stylesheet" href="{fonts}">\n' if theme["fonts"] else ""
    page = f"""<meta charset="utf-8">
<title>{theme["title"]}</title>
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
