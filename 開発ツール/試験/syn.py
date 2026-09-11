# -*- coding: utf-8 -*-
# index.html の <script> を取り出して、JavaScript として読めるか確かめる
import sys, io, re, os, subprocess, tempfile
p = sys.argv[1]
s = io.open(p, encoding="utf-8", newline="").read()
blocks = re.findall(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", s, re.S)
print("%s : <script> %d 個を検査" % (p, len(blocks)))
bad = 0
for i, b in enumerate(blocks):
    f = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8")
    f.write(b); f.close()
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
    os.unlink(f.name)
    if r.returncode:
        bad += 1
        print("NG（%d個目）:\n%s" % (i + 1, (r.stderr or "")[:1200]))
print("OK" if not bad else "NG %d 個" % bad)
sys.exit(1 if bad else 0)
