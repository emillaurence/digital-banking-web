#!/usr/bin/env bash
# Fast visual loop: build lib, (re)start serves, capture, compare. Usage: quick.sh <label> [node]
set -u
STEP="$1"; NODE_VER="${2:-16.20.2}"
REPO=/home/ubuntu/repos/digital-banking-web
source ~/.nvm/nvm.sh && nvm use "$NODE_VER" >/dev/null
cd "$REPO"
pkill -f "ng serve" 2>/dev/null; sleep 1
npx ng build ui-components > /tmp/quick-build.log 2>&1 || { echo "LIB BUILD FAILED"; tail -n 30 /tmp/quick-build.log; exit 1; }
(npx ng serve retail-banking --port 4200 > /tmp/serve-retail.log 2>&1 &)
(npx ng serve wealth-portal --port 4300 > /tmp/serve-wealth.log 2>&1 &)
for i in $(seq 1 60); do
  a=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200/); b=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4300/)
  [ "$a" = 200 ] && [ "$b" = 200 ] && break; sleep 3
done
sleep 4
cd /home/ubuntu/visual
rm -rf "$STEP" "$STEP-diff"
node capture.js "/home/ubuntu/visual/$STEP" > /tmp/quick-capture.log 2>&1 || { echo "CAPTURE FAILED"; tail -n 20 /tmp/quick-capture.log; }
node compare.js baseline-14 "$STEP" "$STEP-diff"
node -e '
const b=require("/home/ubuntu/visual/baseline-14/metrics.json"), c=require(process.argv[1]);
const flat=(o,p="",r={})=>{for(const k in o){const v=o[k];if(v&&typeof v==="object"&&!Array.isArray(v))flat(v,p+k+".",r);else r[p+k]=JSON.stringify(v);}return r};
const fb=flat(b),fc=flat(c);const keys=new Set([...Object.keys(fb),...Object.keys(fc)]);let n=0;
for(const k of [...keys].sort()) if(fb[k]!==fc[k]){n++;console.log(k,"\n  base:",fb[k],"\n  cur: ",fc[k]);}
console.log(n?`metrics differences: ${n}`:"metrics: identical");' "/home/ubuntu/visual/$STEP/metrics.json"
