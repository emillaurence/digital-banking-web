#!/usr/bin/env bash
# Green gate. Usage: green.sh <step-label> [node-version]
# Produces /home/ubuntu/green/<step>/{build,test-*,dts.diff,serve-*}.log, screenshots in
# /home/ubuntu/visual/<step>/ and diffs in /home/ubuntu/visual/<step>-diff/.
set -u
STEP="$1"; NODE_VER="${2:-16.20.2}"
REPO=/home/ubuntu/repos/digital-banking-web
OUT=/home/ubuntu/green/$STEP; mkdir -p "$OUT"
source ~/.nvm/nvm.sh && nvm use "$NODE_VER" >/dev/null || { echo "nvm use $NODE_VER failed"; exit 2; }
cd "$REPO"
echo "node $(node -v) npm $(npm -v)" | tee "$OUT/toolchain.log"

pkill -f "ng serve" 2>/dev/null; sleep 2
rc=0
npx ng build ui-components > "$OUT/build-lib.log" 2>&1; r=$?; echo "build lib rc=$r"; [ $r -ne 0 ] && rc=1
( cd /home/ubuntu/baseline-dist-ui-components && find . -name '*.d.ts' | sort | while read f; do diff -u "$f" "$REPO/dist/ui-components/$f" | sed "s#^--- \.#--- baseline#;s#^+++ .*dist/ui-components/#+++ current/#"; done; cd "$REPO/dist/ui-components" && find . -name '*.d.ts' | sort > /tmp/cur.dts && (cd /home/ubuntu/baseline-dist-ui-components && find . -name '*.d.ts' | sort) > /tmp/base.dts && diff /tmp/base.dts /tmp/cur.dts | sed 's/^/FILELIST: /' ) > "$OUT/dts.diff"; echo "dts diff lines=$(wc -l < "$OUT/dts.diff")"
diff <(node -e 'const p=require("/home/ubuntu/baseline-dist-ui-components/package.json");console.log(JSON.stringify({peer:p.peerDependencies,exports:p.exports,sideEffects:p.sideEffects},null,2))') \
     <(node -e 'const p=require("./dist/ui-components/package.json");console.log(JSON.stringify({peer:p.peerDependencies,exports:p.exports,sideEffects:p.sideEffects},null,2))') > "$OUT/pkg-meta.diff"; echo "pkg meta diff lines=$(wc -l < "$OUT/pkg-meta.diff")"
npx ng build retail-banking > "$OUT/build-retail.log" 2>&1; r=$?; echo "build retail rc=$r"; [ $r -ne 0 ] && rc=1
npx ng build wealth-portal > "$OUT/build-wealth.log" 2>&1; r=$?; echo "build wealth rc=$r"; [ $r -ne 0 ] && rc=1
grep -h -i -E "warning|error" "$OUT"/build-*.log | sort | uniq -c > "$OUT/build-warnings.txt"; echo "build warnings/errors: $(wc -l < "$OUT/build-warnings.txt") distinct"

for p in ui-components retail-banking wealth-portal; do
  npx ng test $p --watch=false --browsers=ChromeHeadless > "$OUT/test-$p.log" 2>&1; r=$?
  summary=$(grep -E "Executed [0-9]+ of [0-9]+" "$OUT/test-$p.log" | tail -n1)
  errs=$(grep -c "ERROR" "$OUT/test-$p.log")
  echo "test $p rc=$r ERROR-lines=$errs :: $summary"; [ $r -ne 0 ] && rc=1; [ "$errs" -ne 0 ] && rc=1
done

(npx ng serve retail-banking --port 4200 > "$OUT/serve-retail.log" 2>&1 &)
(npx ng serve wealth-portal --port 4300 > "$OUT/serve-wealth.log" 2>&1 &)
for i in $(seq 1 60); do
  a=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/); b=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4300/)
  [ "$a" = 200 ] && [ "$b" = 200 ] && break; sleep 3
done
echo "serve: retail=$a wealth=$b"
sleep 5
cd /home/ubuntu/visual
node capture.js "/home/ubuntu/visual/$STEP" > "$OUT/capture.log" 2>&1; r=$?; echo "capture rc=$r"; [ $r -ne 0 ] && { rc=1; tail -n 20 "$OUT/capture.log"; }
node compare.js /home/ubuntu/visual/baseline-14 "/home/ubuntu/visual/$STEP" "/home/ubuntu/visual/$STEP-diff" > "$OUT/compare.txt" 2>&1; cat "$OUT/compare.txt"
node -e '
const b=require("/home/ubuntu/visual/baseline-14/metrics.json"), c=require(process.argv[1]);
const flat=(o,p="",r={})=>{for(const k in o){const v=o[k];if(v&&typeof v==="object"&&!Array.isArray(v))flat(v,p+k+".",r);else r[p+k]=JSON.stringify(v);}return r};
const fb=flat(b),fc=flat(c);const keys=new Set([...Object.keys(fb),...Object.keys(fc)]);let n=0;
for(const k of [...keys].sort()) if(fb[k]!==fc[k]){n++;console.log(k,"\n  base:",fb[k],"\n  cur: ",fc[k]);}
console.log(n?`metrics differences: ${n}`:"metrics: identical");' "/home/ubuntu/visual/$STEP/metrics.json" > "$OUT/metrics.diff" 2>&1; tail -n1 "$OUT/metrics.diff"
pkill -f "ng serve" 2>/dev/null
echo "GREEN-GATE rc=$rc (visual result must be judged separately from $OUT/compare.txt, $OUT/metrics.diff and diff PNGs)"
exit $rc
