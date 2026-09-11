#!/bin/sh
# 現場入力（版156）の試験をまとめて走らせる。
#   用意: この場所で  npm install playwright-core   を1回だけ
#   走らせ方: ./全件.sh      結果は 全件.out
cd "$(dirname "$0")" || exit 1
: > 全件.out
ok=0; ng=0
for f in smoke_*.js; do
  out=$(node "$f" 2>&1)
  if [ $? -eq 0 ]; then ok=$((ok+1)); echo "PASS $f" >> 全件.out
  else ng=$((ng+1)); echo "FAIL $f" >> 全件.out; echo "$out" | tail -20 >> 全件.out; fi
done
echo "=== 通過 $ok / 失敗 $ng ===" >> 全件.out
cat 全件.out
