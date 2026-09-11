# -*- coding: utf-8 -*-
# HTML を壊さずに置き換えるための小道具。
# ・改行は必ず CRLF にそろえる（アプリの index.html は CRLF）
# ・置換は件数を assert してから。合わなければ何も書かない（ファイル無傷）
import io

class Patcher:
    def __init__(self, path):
        self.p = path
        self.s = io.open(path, encoding="utf-8", newline="").read()
        self.n = 0

    def T(self, x):
        return x.replace("\r\n", "\n").replace("\n", "\r\n")

    def has(self, x):
        return self.T(x) in self.s

    def count(self, x):
        return self.s.count(self.T(x))

    def rep(self, old, new, times=1):
        o, w = self.T(old), self.T(new)
        c = self.s.count(o)
        assert c == times, "目印が %d 件（%d 件のはず）: %s" % (c, times, old.strip()[:90])
        self.s = self.s.replace(o, w)
        self.n += c

    def write(self):
        io.open(self.p, "w", encoding="utf-8", newline="").write(self.s)
        print("書きました: %s 置換 %d 箇所" % (self.p, self.n))
