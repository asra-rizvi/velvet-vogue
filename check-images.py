#!/usr/bin/env python3
"""Lists every image the site expects and tells you which are missing.   Run:  python3 check-images.py"""
import re, pathlib
root = pathlib.Path(__file__).parent
files = [*root.glob("*.html"), *root.glob("js/**/*.js"), *root.glob("css/**/*.css")]
want = {}
for f in files:
    for m in re.findall(r"""(?:\.\./)?(img/[\w\-./]+\.(?:jpg|jpeg|png|webp|svg))""", f.read_text(encoding="utf-8")):
        want.setdefault(m, set()).add(f.name)
# denim photos are named d1..dN from the number of rows in the DENIM list of js/products.js
data = (root / "js/products.js").read_text(encoding="utf-8")
block = data[data.index("const DENIM = ["):data.index("const catBySlug")]
for i in range(1, len(re.findall(r"^\s*\['", block, re.M)) + 1):
    want.setdefault(f"img/d{i}.jpg", set()).add("products.js")
missing = sorted((p for p in want if not (root / p).exists()), key=lambda x: (re.sub(r'\d+','',x), int(re.sub(r'\D','',x) or 0)))
present = sorted(p for p in want if (root / p).exists())
extra = sorted(p.name for p in (root / "img").glob("*") if f"img/{p.name}" not in want)
print(f"{len(present)} of {len(want)} expected images found.\n")
if missing:
    print("MISSING:");  [print("  ", m) for m in missing]
if extra:
    print("\nIn img/ but not used by the site (check spelling / numbering):");  [print("  ", e) for e in extra]
if not missing: print("All images are in place.")
