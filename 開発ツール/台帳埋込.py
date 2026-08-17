#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================================
台帳埋込.py — 受付台帳.html を index.html の中へ入れる
----------------------------------------------------------------------------
メインの 📒受付台帳 →「🌐 HTML」は、受付台帳ソフト（受付台帳.html）に台帳の
中身を差し込んだ 1 枚の HTML を書き出します。そのひな型をメイン自身が持って
おくための道具です。持っておくと、書き出すたびにファイルを選ばずに済みます。

  ★ 受付台帳.html を直したら、毎回これを実行してください。
    実行しないと、書き出される HTML が古いままになります。

使い方
    python3 台帳埋込.py                    入れ直す
    python3 台帳埋込.py --check            比べるだけ（最新=0 / 古い=2）
    python3 台帳埋込.py --main … --ledger …   場所を指定する

何をしているか
    受付台帳.html をそのまま base64 にして、index.html の

        <!-- ==受付台帳テンプレート START … == -->
        <script type="text/plain" id="ledger-app-template" …>
        …
        </script>
        <!-- ==受付台帳テンプレート END== -->

    の中身だけを入れ替えます。base64 にするのは、受付台帳.html の中の
    <html> や </head> といった行が、ビューア生成.ps1／.py の目印
    （「</head> の行はちょうど1つ」等）とぶつかって、ビューアを作れなく
    なるのを防ぐためです。
============================================================================
"""
import argparse
import base64
import os
import re
import sys

MARK_START = ("<!-- ==受付台帳テンプレート START "
              "(自動生成: 開発ツール\\台帳埋込.py が 受付台帳.html から入れています。直接編集しないでください) == -->")
MARK_END   = "<!-- ==受付台帳テンプレート END== -->"
TAG_OPEN   = '<script type="text/plain" id="ledger-app-template" data-encoding="base64">'
TAG_CLOSE  = "</script>"
WRAP       = 120          # base64 を折り返す桁数（1行が長すぎると編集しづらいため）

NL = "\r\n"               # メイン(index.html) の改行に合わせる

HERE = os.path.dirname(os.path.abspath(__file__))
UP1  = os.path.dirname(HERE)


class Stop(Exception):
    pass


def read_bytes(path):
    if not os.path.isfile(path):
        raise Stop("ファイルが見つかりません: %s" % path)
    with open(path, "rb") as f:
        data = f.read()
    if data.startswith(b"\xef\xbb\xbf"):
        data = data[3:]
    return data


def build_block(ledger_bytes):
    """受付台帳.html の中身から、index.html に入れる差し込みブロックを作る。"""
    b64 = base64.b64encode(ledger_bytes).decode("ascii")
    lines = [b64[i:i + WRAP] for i in range(0, len(b64), WRAP)]
    return NL.join([MARK_START, TAG_OPEN] + lines + [TAG_CLOSE, MARK_END])


def replace_block(main_text, block):
    """目印の間だけを入れ替える。目印が無ければ </body> の直前に作る。"""
    si = main_text.find(MARK_START)
    ei = main_text.find(MARK_END)
    if si >= 0 and ei > si:
        return main_text[:si] + block + main_text[ei + len(MARK_END):]
    if si >= 0 or ei > 0:
        raise Stop("目印が片方しかありません。index.html の "
                   "『==受付台帳テンプレート START/END==』を確かめてください。")
    # index.html の改行は CRLF なので、行末の \r も見込んでおく
    m = list(re.finditer(r"^[ \t]*</body>[ \t\r]*$", main_text, re.M))
    if len(m) != 1:
        raise Stop("</body> の行が %d 個ありました（1個でないと入れる場所を決められません）。" % len(m))
    at = m[0].start()
    return main_text[:at] + block + NL + main_text[at:]


def main(argv):
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument("--main",   default=os.path.join(UP1, "index.html"))
    ap.add_argument("--ledger", default=os.path.join(UP1, "受付台帳.html"))
    ap.add_argument("--check",  action="store_true")
    a = ap.parse_args(argv)

    main_path, ledger_path = os.path.abspath(a.main), os.path.abspath(a.ledger)
    print("メイン      : %s" % main_path)
    print("受付台帳    : %s" % ledger_path)
    print("")

    ledger = read_bytes(ledger_path)
    cur = read_bytes(main_path).decode("utf-8")
    nxt = replace_block(cur, build_block(ledger))

    if a.check:
        if cur == nxt:
            print("メインの中の受付台帳は最新です（入れ直す必要はありません）。")
            return 0
        print("メインの中の受付台帳が古いままです。--check を外して実行してください。")
        return 2

    if cur == nxt:
        print("すでに最新でした（書き込みませんでした）。")
        return 0

    with open(main_path, "wb") as f:
        f.write(nxt.encode("utf-8"))
    print("受付台帳.html をメインへ入れました。")
    print("  受付台帳 %d バイト → メイン %d バイト" % (len(ledger), len(nxt.encode("utf-8"))))
    print("")
    print("※ このあと 開発ツール/ビューア生成 も実行して、ビューアを作り直してください。")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except Stop as e:
        print("エラー: %s" % e, file=sys.stderr)
        sys.exit(1)
