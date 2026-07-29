<#
  ============================================================================
  ビューア生成.ps1 — メイン(index.html)から「閲覧専用ビューア」を作り直す
  ----------------------------------------------------------------------------
  やっていること
    メイン(index.html) をそのままコピーし、決まった 5 か所に手を入れるだけです。

      1. 自動生成の断り書きを <html> の直前に入れる
      2. <title> を「アンテナ工事 図面・物件ビューア（閲覧専用）」に差し替える
      3. viewer-block.html の STYLE            を </head> の直前に入れる
      4. viewer-block.html の MAP-POINTERDOWN  を地図の onStagePointerDown() の冒頭に入れる
      5. viewer-block.html の SCRIPT           を </body> の直前に入れる

    本体のコードは 1 行も書き換えません。だから表示・計算・印刷はメインと同じで、
    「隠す・止める」だけが viewer-block.html 側に集まります。

  使い方（メインを更新したら毎回これを実行）
      powershell -ExecutionPolicy Bypass -File "…\開発ツール\ビューア生成.ps1"

    出来ているか確かめるだけ（書き込まない）
      powershell -ExecutionPolicy Bypass -File "…\開発ツール\ビューア生成.ps1" -Check

    場所を自分で指定したいとき
      -MainPath  メイン(index.html) の場所
      -BlockPath viewer-block.html の場所
      -OutPath   書き出すビューア(index.html) の場所

  差し込む場所（目印）が見つからないときは、何も書かずにエラーで止まります。
  古いビューアが黙って残るより、止まって気づけるほうが安全なためです。
  メイン側の作りが変わって止まった場合は、このスクリプトの「目印」を直してください。

  文字コード: UTF-8 (BOM 付きで保存してください / Windows PowerShell 5.1 対策)
  ============================================================================
#>
[CmdletBinding()]
param(
  [string]$MainPath,
  [string]$BlockPath,
  [string]$OutPath,
  [switch]$Check
)

$ErrorActionPreference = "Stop"

# ---- 出力に入れる文言（ここを変えると生成物の見た目が変わります） --------------
$BANNER       = '<!-- このファイルは 開発ツール\ビューア生成.ps1 が自動生成した閲覧専用版です。直接編集しないでください。 -->'
$VIEWER_TITLE = '<title>アンテナ工事 図面・物件ビューア（閲覧専用）</title>'
$STYLE_HEAD   = '<!-- ==VIEWER-MODE STYLE START (編集元: 開発ツール\viewer-block.html) == -->'
$STYLE_FOOT   = '<!-- ==VIEWER-MODE STYLE END== -->'
$SCRIPT_HEAD  = '<!-- ==VIEWER-MODE SCRIPT START (編集元: 開発ツール\viewer-block.html) == -->'
$SCRIPT_FOOT  = '<!-- ==VIEWER-MODE SCRIPT END== -->'

$NL = "`r`n"   # メイン(index.html) の改行に合わせる

# ---- 小さな道具 --------------------------------------------------------------
function Fail([string]$msg) {
  Write-Host ""
  Write-Host "【エラー】$msg" -ForegroundColor Red
  Write-Host "ビューアは書き換えていません。" -ForegroundColor Red
  exit 1
}

function Read-TextUtf8([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { Fail "ファイルが見つかりません: $path" }
  return [System.IO.File]::ReadAllText($path, (New-Object System.Text.UTF8Encoding($false)))
}

function Write-TextUtf8NoBom([string]$path, [string]$text) {
  $dir = Split-Path -Parent $path
  if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllText($path, $text, (New-Object System.Text.UTF8Encoding($false)))
}

# 改行で分ける（末尾の改行ぶんの空要素は落とす）
function Split-Lines([string]$text) {
  $a = [regex]::Split($text, "\r\n|\n|\r")
  if ($a.Count -eq 1 -and $a[0] -eq "") { return ,@() }
  if ($a[$a.Count - 1] -eq "") { $a = $a[0..($a.Count - 2)] }
  return ,$a
}

function Find-One([string[]]$lines, [string]$pattern, [string]$what) {
  $hits = @()
  for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i] -match $pattern) { $hits += $i } }
  if ($hits.Count -ne 1) {
    $m  = "メイン(index.html)の中で目印『$what』が $($hits.Count) 件でした（1 件のはずです）。" + $NL
    $m += "        メイン側の作りが変わっている可能性があります。"
    Fail $m
  }
  return $hits[0]
}

# viewer-block.html から 1 ブロック取り出す（前後の空行は落とす）
function Get-Block([string[]]$lines, [string]$name) {
  $head = ("<!-- ==BLOCK {0} START== -->" -f $name)
  $foot = ("<!-- ==BLOCK {0} END== -->" -f $name)
  $si = -1; $ei = -1
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $t = $lines[$i].Trim()
    if ($t -eq $head) { if ($si -ge 0) { Fail "viewer-block.html に『$head』が 2 つ以上あります。" } ; $si = $i }
    elseif ($t -eq $foot) { if ($ei -ge 0) { Fail "viewer-block.html に『$foot』が 2 つ以上あります。" } ; $ei = $i }
  }
  if ($si -lt 0) { Fail "viewer-block.html に『$head』の行がありません。" }
  if ($ei -lt 0) { Fail "viewer-block.html に『$foot』の行がありません。" }
  if ($ei -le $si + 1) { Fail "viewer-block.html の $name ブロックが空です。" }
  $body = @($lines[($si + 1)..($ei - 1)])
  while ($body.Count -gt 0 -and $body[0].Trim() -eq "") { $body = @($body[1..($body.Count - 1)]) }
  while ($body.Count -gt 0 -and $body[$body.Count - 1].Trim() -eq "") { $body = @($body[0..($body.Count - 2)]) }
  if ($body.Count -eq 0) { Fail "viewer-block.html の $name ブロックが空です。" }
  return ,$body
}

# 置いてある場所の候補から最初に見つかったものを返す
function Resolve-First([string[]]$candidates) {
  foreach ($c in $candidates) {
    if ($c -and (Test-Path -LiteralPath $c)) { return (Resolve-Path -LiteralPath $c).Path }
  }
  return $null
}

# ---- 場所を決める ------------------------------------------------------------
$here = $PSScriptRoot
if (-not $here) { $here = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$up1 = Split-Path -Parent $here          # 開発ツール の親
$up2 = Split-Path -Parent $up1

if (-not $BlockPath) { $BlockPath = Join-Path $here "viewer-block.html" }

if (-not $MainPath) {
  $MainPath = Resolve-First @(
    (Join-Path $up1 "index.html"),                          # 開発ツール がメインのリポジトリ直下にある場合
    (Join-Path $up1 (Join-Path "ソフトウェア"   "index.html")),
    (Join-Path $up1 (Join-Path "antenna_main"   "index.html")),
    (Join-Path $up2 (Join-Path "ソフトウェア"   "index.html")),
    (Join-Path $up2 (Join-Path "antenna_main"   "index.html"))
  )
  if (-not $MainPath) { Fail "メイン(index.html)が見つかりませんでした。-MainPath で場所を指定してください。" }
}

if (-not $OutPath) {
  $outDir = Resolve-First @(
    (Join-Path $up1 "ソフトウェア_ビューア"),
    (Join-Path $up1 "antenna_viewer"),
    (Join-Path $up2 "ソフトウェア_ビューア"),
    (Join-Path $up2 "antenna_viewer")
  )
  if (-not $outDir) { Fail "ビューアの置き場所が見つかりませんでした。-OutPath で書き出し先を指定してください。" }
  $OutPath = Join-Path $outDir "index.html"
}

function Full-Path([string]$p) {
  return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($p)
}
$MainPath  = Full-Path $MainPath
$BlockPath = Full-Path $BlockPath
$OutPath   = Full-Path $OutPath

if ($MainPath -eq $OutPath) { Fail "メインと書き出し先が同じファイルです: $MainPath" }

Write-Host "メイン      : $MainPath"
Write-Host "編集元      : $BlockPath"
Write-Host "書き出し先  : $OutPath"

# ---- 読む --------------------------------------------------------------------
$mainText  = Read-TextUtf8 $MainPath
$blockText = Read-TextUtf8 $BlockPath

if ($mainText -match "==VIEWER-MODE") {
  Fail "メインとして指定されたファイルが、すでに生成済みのビューアのようです: $MainPath"
}

$mainLines  = Split-Lines $mainText
$blockLines = Split-Lines $blockText

$styleBody  = Get-Block $blockLines "STYLE"
$mapBody    = Get-Block $blockLines "MAP-POINTERDOWN"
$scriptBody = Get-Block $blockLines "SCRIPT"

# ---- 差し込む場所（目印）を探す ----------------------------------------------
$iHtml  = Find-One $mainLines '^<html'                    '<html …>'
$iTitle = Find-One $mainLines '^\s*<title>.*</title>\s*$' '<title>…</title>'
$iHead  = Find-One $mainLines '^\s*</head>\s*$'           '</head>'
$iBody  = Find-One $mainLines '^\s*</body>\s*$'           '</body>'
$iFunc  = Find-One $mainLines 'function onStagePointerDown' 'function onStagePointerDown'

# 地図の差し込みは「関数の 1 行目（マウス左ボタン判定）の直後」。
# ここがずれると作図が止まらないビューアになってしまうので、必ず確かめる。
$iMap = $iFunc + 1
if ($iMap -ge $mainLines.Count -or $mainLines[$iMap] -notmatch 'e\.pointerType\s*===\s*"mouse"') {
  $m  = "地図の差し込み位置が変わっています。" + $NL
  $m += "        onStagePointerDown() の次の行（$($iMap + 1) 行目）が想定と違います。" + $NL
  $m += "        メイン側を確認して、このスクリプトの目印を直してください。"
  Fail $m
}

# ---- 組み立てる --------------------------------------------------------------
# 差し込む本文は LF、目印の終わり行だけ本文と同じ CRLF（既存のビューアと同じ並び）
$styleInsert  = $STYLE_HEAD  + "`n" + ($styleBody  -join "`n") + "`n" + $STYLE_FOOT  + $NL
$scriptInsert = $SCRIPT_HEAD + "`n" + ($scriptBody -join "`n") + "`n" + $SCRIPT_FOOT + $NL
$mapInsert    = ($mapBody -join $NL) + $NL

$sb = New-Object System.Text.StringBuilder
for ($i = 0; $i -lt $mainLines.Count; $i++) {
  $line = $mainLines[$i]
  if ($i -eq $iHtml)  { [void]$sb.Append($BANNER + $NL) }
  if ($i -eq $iTitle) { $line = $VIEWER_TITLE }
  if ($i -eq $iHead)  { [void]$sb.Append($styleInsert) }
  if ($i -eq $iBody)  { [void]$sb.Append($scriptInsert) }
  [void]$sb.Append($line + $NL)
  if ($i -eq $iMap)   { [void]$sb.Append($mapInsert) }
}
$outText = $sb.ToString()

# ---- 書き出す（-Check なら比べるだけ） ---------------------------------------
$old = $null
if (Test-Path -LiteralPath $OutPath) { $old = Read-TextUtf8 $OutPath }

if ($Check) {
  if ($null -eq $old) {
    Write-Host ""
    Write-Host "ビューアがまだありません。-Check を外して実行してください。" -ForegroundColor Yellow
    exit 2
  }
  if ($old -eq $outText) {
    Write-Host ""
    Write-Host "ビューアは最新です（作り直す必要はありません）。" -ForegroundColor Green
    exit 0
  }
  Write-Host ""
  Write-Host "ビューアが古いです。-Check を外して実行してください。" -ForegroundColor Yellow
  exit 2
}

if ($old -eq $outText) {
  Write-Host ""
  Write-Host "ビューアは最新でした（内容は変わっていません）。" -ForegroundColor Green
} else {
  Write-TextUtf8NoBom $OutPath $outText
  Write-Host ""
  Write-Host "ビューアを作り直しました。" -ForegroundColor Green
}

$outLines = (Split-Lines $outText).Count
Write-Host ("  メイン {0} 行 → ビューア {1} 行（差し込み {2} 行）" -f $mainLines.Count, $outLines, ($outLines - $mainLines.Count))
Write-Host ("  {0} バイト" -f ([System.Text.Encoding]::UTF8.GetByteCount($outText)))
exit 0
