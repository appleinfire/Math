#!/usr/bin/env python3
"""Bundle the app into one self-contained HTML file.

  python3 tools/build.py
    dist/math-expedition.html   full single file: open it anywhere, AirDrop it to an iPad, works offline
    dist/artifact.html          same page without the <html>/<head>/<body> wrapper (for hosts that add their own)
"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + (root / 'css/style.css').read_text() + '</style>')
html = re.sub(r'<script src="(js/[^"]+)"></script>', lambda m: '<script>\n' + (root / m.group(1)).read_text() + '</script>', html)
# Drop pieces that need separate files (manifest, icons, service worker).
html = re.sub(r'\s*<link rel="(manifest|icon|apple-touch-icon)"[^>]*>', '', html)
html = re.sub(r'\s*<script>\s*if \(\'serviceWorker\'.*?</script>', '', html, flags=re.S)
html = html.replace('MQ.app = { init, go, session: () => sess }; // session() is used by the browser smoke test', 'MQ.app = { init, go, session: () => sess };')

dist = root / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'math-expedition.html').write_text(html)

head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
keep = '\n'.join(l for l in head.splitlines() if not re.search(r'<meta (charset|name="viewport")', l))
(dist / 'artifact.html').write_text(keep.strip() + '\n' + body.strip() + '\n')
print('built', *(f'{p.name} ({p.stat().st_size // 1024} KB)' for p in sorted(dist.iterdir())))
