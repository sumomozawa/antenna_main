#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================================
ビューア生成.py — ビューア生成.ps1 と同じことをする Python 版
----------------------------------------------------------------------------
普段は PowerShell 版（ビューア生成.ps1）を使ってください。こちらは

  ・PowerShell が使えない環境（Linux・CI・クラウド上の作業）で作り直したいとき
  ・「ビューアが最新か」を自動で確かめたいとき

のための同等品です。同じ viewer-block.html を読み、1 バイト違わず
同じ index.html を書き出します（違いが出たら、どちらかを直してください）。

使い方
    python3 ビューア生成.py                 作り直す
    python3 ビューア生成.py --check         比べるだけ（最新=0 / 古い=2）
    python3 ビューア生成.py --main … --block … --out …   場所を指定する
============================================================================
"""
import argparse
import os
import re
import sys

BANNER       = '<!-- このファイルは 開発ツール\\ビューア生成.ps1 が自動生成した閲覧専用版です。直接編集しないでください。 -->'
VIEWER_TITLE = '<title>アンテナ工事 図面・物件ビューア（閲覧専用）</title>'
STYLE_HEAD   = '<!-- ==VIEWER-MODE STYLE START (編集元: 開発ツール\\viewer-block.html) == -->'
STYLE_FOOT   = '<!-- ==VIEWER-MODE STYLE END== -->'
SCRIPT_HEAD  = '<!-- ==VIEWER-MODE SCRIPT START (編集元: 開発ツール\\viewer-block.html) == -->'
SCRIPT_FOOT  = '<!-- ==VIEWER-MODE SCRIPT END== -->'

NL = "\r\n"   # メイン(index.html) の改行に合わせる

HERE = os.path.dirname(os.path.abspath(__file__))
UP1  = os.path.dirname(HERE)
UP2  = os.path.dirname(UP1)


class Stop(Exception):
    pass


def read_text(path):
    if not os.path.isfile(path):
        raise Stop("ファイルが見つかりません: %s" % path)
    with open(path, "rb") as f:
        data = f.read()
    if data.startswith(b"\xef\xbb\xbf"):
        data = data[3:]
    return data.decode("utf-8")


def split_lines(text):
    if text == "":
        return []
    a = re.split(r"\r\n|\n|\r", text)
    if a and a[-1] == "":
        a.pop()
    return a


def find_one(lines, pattern, what):
    hits = [i for i, l in enumerate(lines) if re.search(pattern, l)]
    if len(hits) != 1:
        raise Stop("メイン(index.html)の中で目印『%s』が %d 件でした（1 件のはずです）。\n"
                   "        メイン側の作りが変わっている可能性があります。" % (what, len(hits)))
    return hits[0]


def get_block(lines, name):
    head = "<!-- ==BLOCK %s START== -->" % name
    foot = "<!-- ==BLOCK %s END== -->" % name
    si = ei = -1
    for i, l in enumerate(lines):
        t = l.strip()
        if t == head:
            if si >= 0:
                raise Stop("viewer-block.html に『%s』が 2 つ以上あります。" % head)
            si = i
        elif t == foot:
            if ei >= 0:
                raise Stop("viewer-block.html に『%s』が 2 つ以上あります。" % foot)
            ei = i
    if si < 0:
        raise Stop("viewer-block.html に『%s』の行がありません。" % head)
    if ei < 0:
        raise Stop("viewer-block.html に『%s』の行がありません。" % foot)
    body = lines[si + 1:ei]
    while body and body[0].strip() == "":
        body.pop(0)
    while body and body[-1].strip() == "":
        body.pop()
    if not body:
        raise Stop("viewer-block.html の %s ブロックが空です。" % name)
    return body


def resolve_first(candidates):
    for c in candidates:
        if c and os.path.exists(c):
            return os.path.abspath(c)
    return None


def build(main_text, block_text):
    if "==VIEWER-MODE" in main_text:
        raise Stop("メインとして指定されたファイルが、すでに生成済みのビューアのようです。")

    main_lines  = split_lines(main_text)
    block_lines = split_lines(block_text)

    style_body  = get_block(block_lines, "STYLE")
    map_body    = get_block(block_lines, "MAP-POINTERDOWN")
    script_body = get_block(block_lines, "SCRIPT")

    i_html  = find_one(main_lines, r'^<html',                    '<html …>')
    i_title = find_one(main_lines, r'^\s*<title>.*</title>\s*$', '<title>…</title>')
    i_head  = find_one(main_lines, r'^\s*</head>\s*$',           '</head>')
    i_body  = find_one(main_lines, r'^\s*</body>\s*$',           '</body>')
    i_func  = find_one(main_lines, r'function onStagePointerDown', 'function onStagePointerDown')

    # 地図の差し込みは「関数の 1 行目（マウス左ボタン判定）の直後」。
    # ここがずれると作図が止まらないビューアになってしまうので、必ず確かめる。
    i_map = i_func + 1
    if i_map >= len(main_lines) or not re.search(r'e\.pointerType\s*===\s*"mouse"', main_lines[i_map]):
        raise Stop("地図の差し込み位置が変わっています。\n"
                   "        onStagePointerDown() の次の行（%d 行目）が想定と違います。\n"
                   "        メイン側を確認して、このスクリプトの目印を直してください。" % (i_map + 1))

    # 差し込む本文は LF、目印の終わり行だけ本文と同じ CRLF（既存のビューアと同じ並び）
    style_insert  = STYLE_HEAD  + "\n" + "\n".join(style_body)  + "\n" + STYLE_FOOT  + NL
    script_insert = SCRIPT_HEAD + "\n" + "\n".join(script_body) + "\n" + SCRIPT_FOOT + NL
    map_insert    = NL.join(map_body) + NL

    out = []
    for i, line in enumerate(main_lines):
        if i == i_html:
            out.append(BANNER + NL)
        if i == i_title:
            line = VIEWER_TITLE
        if i == i_head:
            out.append(style_insert)
        if i == i_body:
            out.append(script_insert)
        out.append(line + NL)
        if i == i_map:
            out.append(map_insert)
    return "".join(out), len(main_lines)


def main(argv):
    ap = argparse.ArgumentParser(add_help=True, description="メインから閲覧専用ビューアを作り直す")
    ap.add_argument("--main",  dest="main_path")
    ap.add_argument("--block", dest="block_path")
    ap.add_argument("--out",   dest="out_path")
    ap.add_argument("--check", action="store_true", help="書き込まずに、最新かどうかだけ確かめる")
    args = ap.parse_args(argv)

    block_path = args.block_path or os.path.join(HERE, "viewer-block.html")

    main_path = args.main_path or resolve_first([
        os.path.join(UP1, "index.html"),                    # 開発ツール がメインのリポジトリ直下にある場合
        os.path.join(UP1, "ソフトウェア",  "index.html"),
        os.path.join(UP1, "antenna_main",  "index.html"),
        os.path.join(UP2, "ソフトウェア",  "index.html"),
        os.path.join(UP2, "antenna_main",  "index.html"),
    ])
    if not main_path:
        raise Stop("メイン(index.html)が見つかりませんでした。--main で場所を指定してください。")

    out_path = args.out_path
    if not out_path:
        out_dir = resolve_first([
            os.path.join(UP1, "ソフトウェア_ビューア"),
            os.path.join(UP1, "antenna_viewer"),
            os.path.join(UP2, "ソフトウェア_ビューア"),
            os.path.join(UP2, "antenna_viewer"),
        ])
        if not out_dir:
            raise Stop("ビューアの置き場所が見つかりませんでした。--out で書き出し先を指定してください。")
        out_path = os.path.join(out_dir, "index.html")

    main_path  = os.path.abspath(main_path)
    block_path = os.path.abspath(block_path)
    out_path   = os.path.abspath(out_path)
    if main_path == out_path:
        raise Stop("メインと書き出し先が同じファイルです: %s" % main_path)

    print("メイン      : %s" % main_path)
    print("編集元      : %s" % block_path)
    print("書き出し先  : %s" % out_path)

    out_text, n_main = build(read_text(main_path), read_text(block_path))
    old = read_text(out_path) if os.path.isfile(out_path) else None

    if args.check:
        if old is None:
            print("\nビューアがまだありません。--check を外して実行してください。")
            return 2
        if old == out_text:
            print("\nビューアは最新です（作り直す必要はありません）。")
            return 0
        print("\nビューアが古いです。--check を外して実行してください。")
        return 2

    if old == out_text:
        print("\nビューアは最新でした（内容は変わっていません）。")
    else:
        d = os.path.dirname(out_path)
        if d and not os.path.isdir(d):
            os.makedirs(d)
        with open(out_path, "wb") as f:
            f.write(out_text.encode("utf-8"))   # UTF-8 / BOM なし
        print("\nビューアを作り直しました。")

    n_out = len(split_lines(out_text))
    print("  メイン %d 行 → ビューア %d 行（差し込み %d 行）" % (n_main, n_out, n_out - n_main))
    print("  %d バイト" % len(out_text.encode("utf-8")))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except Stop as e:
        sys.stderr.write("\n【エラー】%s\nビューアは書き換えていません。\n" % e)
        sys.exit(1)
