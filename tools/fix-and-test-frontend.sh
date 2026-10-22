#!/usr/bin/env bash
# =============================================================================
# tools/fix-and-test-frontend.sh
#
# Diagnose, (optionally) repair, build and test the Sweety Sweet Angular
# frontend. Read-only by default.
#
#   --check      diagnostics only (default when no mode is given)
#   --dry-run    diagnostics + show the exact diffs --repair WOULD apply
#   --repair     apply the small, deterministic, verified source repairs
#   --build      production build into <report-dir>/build-out (never ./dist)
#   --test       unit tests (needs node_modules and a Chrome binary)
#
# Safety properties:
#   * Never commits, pushes, resets, cleans or deploys. Never touches Docker.
#   * Reports/backups go OUTSIDE the repo (the repo auto-commits itself).
#   * Never deletes node_modules; `--install` only runs `npm ci` when
#     node_modules does not exist.
#   * Repairs: exact-match, single-occurrence, backed up, refused on dirty
#     files, idempotent (a second run reports "already applied").
#   * Only GET/HEAD-style reads are sent to any URL. TLS is never disabled.
#   * An API token may be supplied ONLY via env SWEETY_API_TOKEN (never argv),
#     and is sent only to --api-url over https.
#
# Exit codes: 0 all required checks pass | 1 a required check failed
#             2 invalid usage / missing prerequisite
#             3 blocked or incomplete (a required result could not be
#               established, e.g. no node_modules, no Chrome, API needs auth)
# =============================================================================
set -Eeuo pipefail
umask 077   # reports and backups (full copies of source files) are private to the running user

readonly VERSION="1.0.0"
readonly EX_OK=0 EX_FAIL=1 EX_USAGE=2 EX_BLOCKED=3

REPO_ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
TS="$(date +%Y%m%d_%H%M%S)"

DO_CHECK=0; DO_DRY=0; DO_REPAIR=0; DO_BUILD=0; DO_TEST=0; DO_INSTALL=0
API_URL=""; FRONTEND_URL=""; REPORT_DIR=""; CA_BUNDLE=""
FINALIZED=0
AUTH_HDR_FILE=""
CHECKS_TSV=""; LOG=""; REPAIR_TSV=""; BACKUP_DIR=""

# Obsolete domains, established from the repository itself: the commented-out
# apiUrl in src/environments/*.ts and the guard in app-patchsept26.sh.
# Do NOT add arbitrary external URLs here.
STALE_DOMAINS=("node-js.justdo-it.uk")

# ----------------------------------------------------------------------------
usage() {
  cat <<'EOF'
Usage: tools/fix-and-test-frontend.sh [mode...] [options]

Modes (combinable except --dry-run with --repair; default is --check):
  --check            Diagnostics only. Changes nothing in the repository.
  --dry-run          Diagnostics, then print the diffs --repair would apply.
  --repair           Apply the verified source repairs (backups first).
  --build            Production build into <report-dir>/build-out.
  --test             Run unit tests (ng test, headless Chrome).
  --install          Run `npm ci` ONLY if node_modules is absent.
  --help             This text.

Options:
  --api-url URL        API base URL (e.g. https://host:8183). Enables the
                       read-only API checks. Never guessed.
  --frontend-url URL   Served frontend URL. Enables HTTP/bundle/SPA checks.
  --ca-bundle PATH     Extra CA file for private/self-signed TLS (instead of
                       ever disabling verification).
  --report-dir PATH    Where logs/reports/backups go (must be outside the
                       repo). Default: <repo>/../<repo-name>.fix-reports/<ts>

Environment:
  SWEETY_API_TOKEN     Optional bearer token for the read-only API GETs.

Exit codes: 0 pass | 1 required check failed | 2 usage/prerequisite | 3 blocked
EOF
}

# ---------------------------------------------------------------------------- args
need_val() { [[ $# -ge 2 && -n "${2:-}" && "${2:0:2}" != "--" ]] || { echo "ERROR: $1 needs a value" >&2; exit $EX_USAGE; }; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)     usage; exit $EX_OK ;;
    --check)       DO_CHECK=1 ;;
    --dry-run)     DO_DRY=1 ;;
    --repair)      DO_REPAIR=1 ;;
    --build)       DO_BUILD=1 ;;
    --test)        DO_TEST=1 ;;
    --install)     DO_INSTALL=1 ;;
    --api-url)      need_val "$@"; API_URL="${2%/}"; shift ;;
    --frontend-url) need_val "$@"; FRONTEND_URL="${2%/}"; shift ;;
    --ca-bundle)    need_val "$@"; CA_BUNDLE="$2"; shift ;;
    --report-dir)   need_val "$@"; REPORT_DIR="$2"; shift ;;
    *) echo "ERROR: unknown argument: $1" >&2; usage >&2; exit $EX_USAGE ;;
  esac
  shift
done
if (( DO_DRY && DO_REPAIR )); then echo "ERROR: --dry-run and --repair are mutually exclusive" >&2; exit $EX_USAGE; fi
if (( !DO_DRY && !DO_REPAIR && !DO_BUILD && !DO_TEST && !DO_INSTALL )); then DO_CHECK=1; fi

validate_url() { # $1 flag name, $2 url
  local u="$2"
  [[ "$u" =~ ^https?://[A-Za-z0-9._-]+(:[0-9]{1,5})?(/[^[:space:]]*)?$ ]] \
    || { echo "ERROR: $1 must look like http(s)://host[:port][/path] with no credentials/query (value not echoed)" >&2; exit $EX_USAGE; }
}
[[ -n "$API_URL" ]] && validate_url --api-url "$API_URL"
[[ -n "$FRONTEND_URL" ]] && validate_url --frontend-url "$FRONTEND_URL"
if [[ -n "$CA_BUNDLE" && ! -r "$CA_BUNDLE" ]]; then echo "ERROR: --ca-bundle not readable: $CA_BUNDLE" >&2; exit $EX_USAGE; fi

# ---------------------------------------------------------------------------- hard prerequisites
for t in git python3 sha256sum diff grep sed awk find df; do
  command -v "$t" >/dev/null 2>&1 || { echo "ERROR: required tool missing: $t" >&2; exit $EX_USAGE; }
done
for f in angular.json package.json package-lock.json src/main.ts src/app src/environments/environment.ts; do
  [[ -e "$REPO_ROOT/$f" ]] || { echo "ERROR: $REPO_ROOT does not look like the Sweety Sweet repo (missing $f). Run the script from <repo>/tools/." >&2; exit $EX_USAGE; }
done
git -C "$REPO_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "ERROR: $REPO_ROOT is not a git work tree" >&2; exit $EX_USAGE; }
if (( DO_BUILD || DO_TEST || DO_INSTALL )); then
  for t in node npm; do command -v "$t" >/dev/null 2>&1 || { echo "ERROR: $t is required for --build/--test/--install" >&2; exit $EX_USAGE; }; done
fi
if [[ -n "$API_URL$FRONTEND_URL" ]]; then
  command -v curl >/dev/null 2>&1 || { echo "ERROR: curl is required for --api-url/--frontend-url checks" >&2; exit $EX_USAGE; }
fi

# ---------------------------------------------------------------------------- report dir
[[ -z "$REPORT_DIR" ]] && REPORT_DIR="$(dirname "$REPO_ROOT")/$(basename "$REPO_ROOT").fix-reports/$TS"
mkdir -p "$REPORT_DIR"; REPORT_DIR="$(cd "$REPORT_DIR" && pwd -P)"
case "$REPORT_DIR/" in
  "$REPO_ROOT"/*) rmdir "$REPORT_DIR" 2>/dev/null || true
                  echo "ERROR: --report-dir must be OUTSIDE the repo (its auto-commit would publish reports): $REPORT_DIR" >&2
                  exit $EX_USAGE ;;
esac
CHECKS_TSV="$REPORT_DIR/checks.tsv"; LOG="$REPORT_DIR/run.log"; REPAIR_TSV="$REPORT_DIR/repairs.tsv"
BACKUP_DIR="$REPORT_DIR/backup"
: >"$CHECKS_TSV"; : >"$LOG"; : >"$REPAIR_TSV"

# ---------------------------------------------------------------------------- helpers
sanitize() { # redact obvious secrets from anything that reaches logs/reports
  sed -E \
    -e 's/(Bearer )[A-Za-z0-9._~+\/=-]+/\1<redacted>/g' \
    -e 's#(://)[^/@[:space:]]+@#\1<redacted>@#g' \
    -e 's/((password|passwd|secret|token|api[_-]?key|authorization|client_secret)[\x22\x27 ]*[:=][\x22\x27 ]*)[^\x22\x27 ,;]+/\1<redacted>/Ig' \
    -e 's/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/<redacted-jwt>/g' \
    -e 's/[A-Za-z0-9+]{40,}={0,2}/<redacted-blob>/g'
}
log() { printf '%s\n' "$*" | sanitize | tee -a "$LOG" >/dev/null; }
say() { printf '%s\n' "$*" | sanitize | tee -a "$LOG"; }

# record ID STATUS REQUIRED SEVERITY DESCRIPTION [EVIDENCE]
#   STATUS: PASS | FAIL | WARN | BLOCKED | SKIP    REQUIRED: 1|0
record() {
  local id="$1" st="$2" req="$3" sev="$4" desc="$5" ev="${6:-}"
  ev="$(printf '%s' "$ev" | sanitize | tr '\t\r\n' '   ' | cut -c1-700)"
  desc="$(printf '%s' "$desc" | sanitize | tr '\t\r\n' '   ')"
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$id" "$st" "$req" "$sev" "$desc" "$ev" >>"$CHECKS_TSV"
  printf '  [%-7s] %-28s %s\n' "$st" "$id" "$desc" | tee -a "$LOG"
}

rel() { printf '%s' "${1#"$REPO_ROOT"/}"; }
count_lines() { if [[ -z "$1" ]]; then echo 0; else printf '%s\n' "$1" | wc -l | tr -d ' '; fi; }

explain_curl_rc() {
  case "$1" in
    0) echo "ok" ;;
    6) echo "DNS: host name could not be resolved (DNS issue, not a frontend defect)" ;;
    7) echo "connection refused / host unreachable (service down or wrong port)" ;;
    28) echo "timeout" ;;
    35) echo "TLS handshake failed (protocol/cipher mismatch, or HTTP server on an HTTPS port / vice versa)" ;;
    51|58|59|60|77|82|83) echo "TLS certificate not trusted/valid for this host (self-signed or name mismatch; use --ca-bundle for a private CA)" ;;
    52) echo "empty reply from server" ;;
    56) echo "connection reset / proxy refused" ;;
    *) echo "curl exit $1" ;;
  esac
}

PROBE_CODE=""; PROBE_CT=""; PROBE_RC=0
http_probe() { # url prefix
  local url="$1" prefix="$2" args
  args=(-sS -m 20 -o "$prefix.body" -D "$prefix.hdr" -w '%{http_code}')
  [[ -n "$CA_BUNDLE" ]] && args+=(--cacert "$CA_BUNDLE")
  if [[ -n "$AUTH_HDR_FILE" && -n "$API_URL" && "$url" == "$API_URL"* ]]; then args+=(-H "@$AUTH_HDR_FILE"); fi
  set +e
  PROBE_CODE="$(curl "${args[@]}" "$url" 2>"$prefix.err")"; PROBE_RC=$?
  set -e
  PROBE_CT="$( { grep -i '^content-type:' "$prefix.hdr" 2>/dev/null || true; } | tail -1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//')"
}

# ---------------------------------------------------------------------------- reporting / exit
write_reports() { # $1 exit code
  local code="$1" branch sha dirty
  branch="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
  sha="$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo unknown)"
  dirty="$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no 2>/dev/null | wc -l | tr -d ' ')"
  FFT_VERSION="$VERSION" FFT_BRANCH="$branch" FFT_SHA="$sha" FFT_DIRTY="$dirty" FFT_CODE="$code" \
  FFT_MODES="check=$DO_CHECK dry_run=$DO_DRY repair=$DO_REPAIR build=$DO_BUILD test=$DO_TEST install=$DO_INSTALL" \
  FFT_TS="$TS" python3 -I - "$CHECKS_TSV" "$REPAIR_TSV" "$REPORT_DIR" <<'PY'
import csv, json, os, sys
tsv, rep, out = sys.argv[1:4]
rows = []
with open(tsv, newline='') as f:
    for r in csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
        if len(r) < 6: continue
        rows.append(dict(id=r[0], status=r[1], required=r[2] == '1', severity=r[3], description=r[4], evidence=r[5]))
env = os.environ
cnt = {}
for r in rows: cnt[r['status']] = cnt.get(r['status'], 0) + 1
doc = dict(script_version=env['FFT_VERSION'], timestamp=env['FFT_TS'], exit_code=int(env['FFT_CODE']),
           modes=env['FFT_MODES'], repo=dict(branch=env['FFT_BRANCH'], commit=env['FFT_SHA'],
           uncommitted_files_at_report_time=int(env['FFT_DIRTY'])), counts=cnt, checks=rows)
with open(os.path.join(out, 'checks.json'), 'w') as f: json.dump(doc, f, indent=2)
with open(os.path.join(out, 'checks.json')) as f: json.load(f)   # validate

meaning = {0: 'all required checks passed', 1: 'a required check FAILED',
           2: 'invalid usage or missing prerequisite', 3: 'BLOCKED/INCOMPLETE - a required result could not be established'}
lines = ['Sweety Sweet frontend fix-and-test', 'script %s  %s' % (env['FFT_VERSION'], env['FFT_TS']),
         'repo branch=%s commit=%s uncommitted_files=%s' % (env['FFT_BRANCH'], env['FFT_SHA'][:12], env['FFT_DIRTY']),
         'modes: ' + env['FFT_MODES'],
         'exit code: %s (%s)' % (env['FFT_CODE'], meaning.get(int(env['FFT_CODE']), '?')),
         'counts: ' + ', '.join('%s=%d' % kv for kv in sorted(cnt.items())), '']
high = [r for r in rows if r['severity'] == 'high' and r['status'] in ('FAIL', 'WARN')]
if high:
    lines.append('HIGH-severity items needing manual action:')
    lines += ['  - %s: %s' % (r['id'], r['description']) for r in high]
    lines.append('')
notpass = [r for r in rows if r['status'] in ('FAIL', 'BLOCKED', 'SKIP')]
if notpass:
    lines.append('Not passed (never counted as PASS):')
    lines += ['  - [%s%s] %s: %s' % (r['status'], '*' if r['required'] else '', r['id'], r['description']) for r in notpass]
    lines.append('  (* = required for the exit code)')
with open(os.path.join(out, 'summary.txt'), 'w') as f: f.write('\n'.join(lines) + '\n')

order = ['FAIL', 'BLOCKED', 'FIXED', 'WARN', 'SKIP', 'PASS']
titles = {'FIXED': 'Defects fixed by --repair and re-verified', 'FAIL': 'Confirmed defects / failed checks', 'BLOCKED': 'Environmental blockers (result not established)',
          'WARN': 'Suspected defects and review items', 'SKIP': 'Not executed', 'PASS': 'Passed'}
md = ['# Findings', '', 'Generated by tools/fix-and-test-frontend.sh %s at %s. Exit code %s.' % (env['FFT_VERSION'], env['FFT_TS'], env['FFT_CODE']), '']
for st in order:
    sel = [r for r in rows if r['status'] == st]
    if not sel: continue
    md += ['## %s (%d)' % (titles[st], len(sel)), '']
    for r in sel:
        md.append('- **%s** [%s%s] %s' % (r['id'], r['severity'], ', required' if r['required'] else '', r['description']))
        if r['evidence']: md.append('  - evidence: `%s`' % r['evidence'].replace('`', "'"))
    md.append('')
with open(os.path.join(out, 'findings.md'), 'w') as f: f.write('\n'.join(md))

if os.path.getsize(rep) > 0:
    pm = ['# Patch summary', '', '| id | file | action | sha256 before | sha256 after |', '|---|---|---|---|---|']
    with open(rep, newline='') as f:
        for r in csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            if len(r) >= 5: pm.append('| ' + ' | '.join(x[:12] if i >= 3 else x for i, x in enumerate(r[:5])) + ' |')
    pm += ['', 'Diffs are in `patches/`; originals are in `backup/` (same relative paths, modes preserved).',
           'Nothing was committed, pushed or deployed.']
    with open(os.path.join(out, 'patch-summary.md'), 'w') as f: f.write('\n'.join(pm) + '\n')
PY
}

finish() { # computes the exit code from the recorded checks
  local code=$EX_OK
  if awk -F'\t' '$2=="FAIL" && $3==1 {f=1} END{exit !f}' "$CHECKS_TSV"; then code=$EX_FAIL
  elif awk -F'\t' '($2=="BLOCKED"||$2=="SKIP") && $3==1 {f=1} END{exit !f}' "$CHECKS_TSV"; then code=$EX_BLOCKED; fi
  write_reports "$code"
  FINALIZED=1
  echo
  cat "$REPORT_DIR/summary.txt"
  echo; echo "Reports: $REPORT_DIR"
  exit "$code"
}

on_exit() {
  local rc=$?
  [[ -n "$AUTH_HDR_FILE" ]] && rm -f "$AUTH_HDR_FILE"
  if (( ! FINALIZED )) && [[ -n "$CHECKS_TSV" && -d "$REPORT_DIR" ]]; then
    record SCRIPT-ABORT BLOCKED 1 high "script stopped unexpectedly (exit $rc) before finishing; results incomplete" "see run.log"
    FINALIZED=1; write_reports $EX_BLOCKED; echo "Reports: $REPORT_DIR" >&2
    exit $EX_BLOCKED
  fi
}
trap on_exit EXIT

# ============================================================================ PREFLIGHT
preflight() {
  say "== Preflight"
  local branch sha dirty
  branch="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"; sha="$(git -C "$REPO_ROOT" rev-parse HEAD)"
  dirty="$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no | wc -l | tr -d ' ')"
  { echo "repo=$REPO_ROOT"; echo "branch=$branch"; echo "commit=$sha"; echo "uncommitted_files=$dirty"; } >"$REPORT_DIR/repo-state.txt"
  record PRE-GIT PASS 0 info "git repo ok: branch=$branch commit=${sha:0:12}" "uncommitted files: $dirty"
  if (( dirty > 0 )); then
    record PRE-GIT-CLEAN WARN 0 low "working tree has $dirty uncommitted file(s); --repair refuses to touch any of them" "$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no | head -5)"
  fi

  local req=0; (( DO_BUILD || DO_TEST || DO_INSTALL )) && req=1
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    local nv npmv; nv="$(node -v)"; npmv="$(npm -v)"
    local cli; cli="$(python3 -I -c 'import json,sys;print(json.load(open(sys.argv[1]))["devDependencies"]["@angular/cli"])' "$REPO_ROOT/package.json")"
    # Angular CLI 18.2 supports Node ^18.19.1 || ^20.11.1 || >=22.0.0 (checked only for the 18.x family).
    local verdict
    verdict="$(python3 -I - "$nv" "$cli" <<'PY'
import re, sys
v = tuple(int(x) for x in re.match(r'v(\d+)\.(\d+)\.(\d+)', sys.argv[1]).groups())
cli = re.search(r'(\d+)\.', sys.argv[2]); cli = int(cli.group(1)) if cli else -1
if cli != 18: print('unknown'); sys.exit()
ok = (v[0] == 18 and v >= (18, 19, 1)) or (v[0] == 20 and v >= (20, 11, 1)) or v[0] >= 22
print('ok' if ok else 'bad')
PY
)"
    case "$verdict" in
      ok) record PRE-NODE PASS $req info "node $nv / npm $npmv supported by Angular CLI $cli" ;;
      bad) record PRE-NODE FAIL $req high "node $nv is NOT supported by Angular CLI $cli (needs ^18.19.1 || ^20.11.1 || >=22)" "node $nv" ;;
      *) record PRE-NODE WARN 0 low "node $nv / npm $npmv; support matrix not validated for CLI '$cli'" ;;
    esac
  else
    record PRE-NODE BLOCKED $req medium "node/npm not found; build and tests cannot run" ""
  fi

  if [[ -d "$REPO_ROOT/node_modules/@angular/core" && -x "$REPO_ROOT/node_modules/.bin/ng" ]]; then
    record PRE-DEPS PASS 0 info "node_modules present (Angular CLI installed)"
  else
    local st=SKIP; (( req )) && st=BLOCKED
    record PRE-DEPS $st 0 medium "node_modules missing/incomplete; run with --install (npm ci from package-lock.json) before --build/--test" ""
  fi

  local free_mb; free_mb="$(df -Pk "$REPO_ROOT" | awk 'NR==2{printf "%d", $4/1024}')"
  if (( free_mb >= 2048 )); then record PRE-DISK PASS 0 info "free disk ${free_mb} MiB"
  else record PRE-DISK WARN "$req" medium "only ${free_mb} MiB free (build needs ~2 GiB)"; fi

  if command -v docker >/dev/null 2>&1; then
    local c="none"
    if docker compose version >/dev/null 2>&1; then c="docker compose (plugin)"; elif command -v docker-compose >/dev/null 2>&1; then c="docker-compose (v1)"; fi
    record PRE-DOCKER PASS 0 info "docker present; compose implementation: $c. This script never starts/stops/rebuilds containers."
  else
    record PRE-DOCKER SKIP 0 info "docker not installed (not needed; this script never touches containers)"
  fi
  return 0
}

# ============================================================================ STATIC DIAGNOSTICS
diag_defects() { # $1 tag ("" or ".post")
  local tag="${1:-}" hits n f
  say "== Defect checks${tag:+ (after repair)}"

  hits="$(grep -rnE '\$\{environment\.expose_image\}' "$REPO_ROOT/src" --include='*.ts' 2>/dev/null | grep -v '\.spec\.ts' || true)"
  hits="${hits//$REPO_ROOT\//}"
  if [[ -n "$hits" ]]; then
    record "IMG-OBJECT-INTERP$tag" FAIL 1 high "image URL built from the whole environment.expose_image object (renders '[object Object]/...')" "$hits"
  else
    record "IMG-OBJECT-INTERP$tag" PASS 1 info "no template literal interpolates the expose_image object directly"
  fi

  hits=""
  for f in "$REPO_ROOT"/src/environments/*.ts; do
    n="$(grep -nE "https?://[^'\" ]+:[0-9]+[A-Za-z]" "$f" || true)"
    [[ -n "$n" ]] && hits+="$(rel "$f"): $n"$'\n'
    n="$(grep -nE "^[[:space:]]*[^/[:space:]].*https?:/[^/]" "$f" || true)"
    [[ -n "$n" ]] && hits+="$(rel "$f"): $n"$'\n'
  done
  if [[ -n "$hits" ]]; then
    record "ENV-MALFORMED-URL$tag" FAIL 1 high "malformed URL in environment file (port followed by letters, or single slash after scheme)" "${hits%$'\n'}"
  else
    record "ENV-MALFORMED-URL$tag" PASS 1 info "no malformed URLs in src/environments"
  fi
  return 0
}

diag_static() {
  say "== Static diagnostics"
  local f n out

  # --- Angular build configuration
  out="$(python3 -I - "$REPO_ROOT/angular.json" <<'PY'
import json, sys
a = json.load(open(sys.argv[1])); p = next(iter(a['projects'].values())); b = p['architect']['build']
print(b['options'].get('outputPath'), '|', 'prod_fileReplacements=%d' % len(b['configurations'].get('production', {}).get('fileReplacements', [])),
      '|', 'assets=' + ','.join(map(str, b['options'].get('assets', []))), '|', 'builder=' + b['builder'])
PY
)"
  record CFG-ANGULAR PASS 0 info "angular.json parsed" "$out"
  if [[ "$out" == *"prod_fileReplacements=0"* ]] && grep -qE "production:[[:space:]]*false" "$REPO_ROOT/src/environments/environment.ts"; then
    record CFG-PROD-ENV WARN 0 medium "production build has no fileReplacements, so it ships src/environments/environment.ts, which says production:false; environment.development.ts is a byte-for-byte duplicate (verify intended)" "$(cmp -s "$REPO_ROOT/src/environments/environment.ts" "$REPO_ROOT/src/environments/environment.development.ts" && echo 'environment.ts == environment.development.ts')"
  fi
  n="$(find "$REPO_ROOT/src/assets" -type f ! -name '.gitkeep' 2>/dev/null | wc -l | tr -d ' ')"
  record CFG-ASSETS PASS 0 info "src/assets holds $n image/asset file(s); product images are served from an external host (environment.expose_image.local_images), not bundled"

  # --- apiUrl / private address baked into the bundle
  local api; api="$(grep -E "^[[:space:]]*apiUrl:" "$REPO_ROOT/src/environments/environment.ts" | head -1 | sed -E "s/.*apiUrl:[[:space:]]*['\"]([^'\"]+)['\"].*/\1/")"
  if [[ "$api" =~ ^https?://(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.) ]]; then
    record CFG-PRIVATE-API WARN 0 medium "apiUrl is a private LAN address baked into the bundle ($api): only browsers on that LAN can reach the API/images; https to a bare IP also needs a certificate with that IP in its SAN" "$api"
  else
    record CFG-PRIVATE-API PASS 0 info "apiUrl is not a private-range address" "$api"
  fi

  diag_defects ""

  # --- stale domains (explicit list only; comments reported separately)
  local d hits_code hits_comment tracked_bundle
  for d in "${STALE_DOMAINS[@]}"; do
    hits_code=""; hits_comment=""
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      if [[ "$(printf '%s' "$line" | cut -d: -f3- | sed -E 's/^[[:space:]]+//')" == //* ]]; then hits_comment+="$line"$'\n'; else hits_code+="$line"$'\n'; fi
    done < <(grep -rnF "$d" "$REPO_ROOT/src" --include='*.ts' --include='*.html' 2>/dev/null | sed "s#^$REPO_ROOT/##" || true)
    if [[ -n "$hits_code" ]]; then record "STALE-DOMAIN" FAIL 1 high "obsolete domain '$d' is used by live source" "${hits_code%$'\n'}"
    else record "STALE-DOMAIN" PASS 1 info "obsolete domain '$d' not used by live source (comment-only mentions: $(count_lines "${hits_comment%$'\n'}"))"; fi
    tracked_bundle="$(grep -lF "$d" "$REPO_ROOT"/public/*.js 2>/dev/null | sed "s#^$REPO_ROOT/##" || true)"
    if [[ -n "$tracked_bundle" ]]; then record "STALE-DOMAIN-BUNDLE" WARN 0 medium "committed compiled bundle in public/ still contains '$d' (stale build output)" "$tracked_bundle"; fi
  done
  if [[ -f "$REPO_ROOT/app-patchsept26.sh" ]] \
     && grep -q "node-js.justdo-it.uk\|node\.justdo-it\.uk" "$REPO_ROOT/src/environments/environment.ts"; then
    record DEPLOY-PATCHSCRIPT WARN 0 medium "app-patchsept26.sh aborts at step 1: its stale-domain grep matches the COMMENTED apiUrl line in environment.ts. (Its later steps also run 'rm -rf node_modules' and 'docker-compose up --force-recreate'; it was NOT run and is not modified.)" "grep exit 0 on environment.ts"
  fi

  # --- image references in templates/CSS
  local dyn static_bad=""
  dyn="$(grep -rlE '\[(src|ngSrc)\]=' "$REPO_ROOT/src" --include='*.html' | wc -l | tr -d ' ')"
  while IFS= read -r m; do
    [[ -z "$m" ]] && continue
    local p="${m##*src=\"}"; p="${p%\"}"
    [[ "$p" =~ ^(https?:|data:|//|\{\{) ]] && continue
    if [[ ! -e "$REPO_ROOT/src/$p" && ! -e "$REPO_ROOT/src/assets/${p#assets/}" ]]; then static_bad+="$m"$'\n'; fi
  done < <(grep -rnoE '<img[^>]*[[:space:]]src="[^"]+"' "$REPO_ROOT/src" --include='*.html' | sed "s#^$REPO_ROOT/##" || true)
  if [[ -n "$static_bad" ]]; then record IMG-STATIC-REFS FAIL 1 medium "static <img src> points to a file that does not exist (case-sensitive check)" "${static_bad%$'\n'}"
  else record IMG-STATIC-REFS PASS 1 info "no static <img src> references to missing local files; $dyn template(s) bind [src] dynamically (cannot be verified statically)"; fi

  n="$(grep -rnoE 'https?://[A-Za-z0-9.-]*_[A-Za-z0-9._-]*' "$REPO_ROOT/src" --include='*.html' --include='*.ts' 2>/dev/null | grep -v '\.spec\.ts' | sed "s#^$REPO_ROOT/##" | sort -u -t: -k3 | head -8 || true)"
  if [[ -n "$n" ]]; then record IMG-UNDERSCORE-HOST WARN 0 medium "loader/success GIF iframes use host names containing '_' (e.g. expose_images.justdo-it.uk): underscores are not valid in DNS host names or TLS certificate names, so browsers/proxies may refuse them. SUSPECTED - not verified from here; check with --frontend-url from a browser network tab" "$n"; fi

  if grep -qE "let url = 'Product0'" "$REPO_ROOT/src/app/Images/image.service.ts" 2>/dev/null; then
    record IMG-UNKNOWN-PRODUCT WARN 0 low "ImageService.getProductUrl returns the bare string 'Product0' for an unknown/not-yet-loaded product; as a relative URL it resolves to /Product0 (probably served as index.html by the SPA fallback), so the <img> only recovers via (error). SUSPECTED; returning the fallback image directly would be deterministic" "src/app/Images/image.service.ts"
  fi

  # --- interceptor / headers
  if grep -qE "'X-User-ID'[[:space:]]*:[[:space:]]*user_details\.user" "$REPO_ROOT/src/app/auth-interceptor.service.interceptor.ts" 2>/dev/null; then
    record API-USERID-HEADER WARN 0 medium "interceptor sets X-User-ID to JSON.stringify(<decoded JWT claims>) on every API request: leaks claims, may exceed header limits, and is not an id. SUSPECTED defect; fix needs a decision on which claim (e.g. sub) the backend expects" "src/app/auth-interceptor.service.interceptor.ts"
  fi

  # --- Docker / dev server flags
  if grep -qE "^RUN npm install" "$REPO_ROOT/Dockerfile" 2>/dev/null; then
    record DOCKER-NPM-INSTALL WARN 0 low "Dockerfile uses 'npm install' (not lockfile-exact) so the image can differ from what you tested; prefer 'npm ci'. Not changed (deployment file)" "Dockerfile"
  fi
  if grep -q -- "--disable-host-check" "$REPO_ROOT/package.json"; then
    record DEV-HOSTCHECK WARN 0 low "npm scripts http/https start ng serve with --disable-host-check (dev-server DNS-rebinding protection off) and bind 0.0.0.0; acceptable only on a trusted LAN. Not changed" "package.json"
  fi
  n="$(find "$REPO_ROOT/src" \( -name '*.backup_*' -o -name '* copy.ts' \) | wc -l | tr -d ' ')"
  if (( n > 0 )); then record SRC-CLUTTER WARN 0 low "$n backup/copy file(s) under src/ (e.g. 'product.service copy.ts'); not compiled (outside main.ts import graph) but confusing" ""; fi

  # --- security review (never prints secret material)
  local keys
  keys="$(git -C "$REPO_ROOT" grep -lE -e '-----BEGIN ([A-Z]+ )?PRIVATE KEY-----' -- . 2>/dev/null | head -10 || true)"
  if [[ -n "$keys" ]]; then
    local pair="key/cert relation not checked"
    if command -v openssl >/dev/null 2>&1 && [[ -f "$REPO_ROOT/certificate.key" && -f "$REPO_ROOT/certificate.crt" ]]; then
      local a b
      a="$(openssl pkey -in "$REPO_ROOT/certificate.key" -pubout 2>/dev/null | sha256sum | cut -c1-16 || true)"
      b="$(openssl x509 -in "$REPO_ROOT/certificate.crt" -noout -pubkey 2>/dev/null | sha256sum | cut -c1-16 || true)"
      [[ "$a" == "$b" ]] && pair="certificate.key MATCHES certificate.crt (self-signed, expires: $(openssl x509 -in "$REPO_ROOT/certificate.crt" -noout -enddate 2>/dev/null | cut -d= -f2))" || pair="certificate.key does not match certificate.crt"
    fi
    record SEC-PRIVATE-KEY WARN 0 high "private key(s) tracked in git (committed): $(count_lines "$keys") file(s). Treat as exposed: rotate/revoke, remove from the repo and ignore it. History was NOT rewritten and nothing was rotated by this script. $pair" "$keys"
  else
    record SEC-PRIVATE-KEY PASS 0 info "no private key blocks in tracked files"
  fi
  if grep -qE "^[[:space:]]*genearate_tempkey:[[:space:]]*[\"'][^\"']+[\"']" "$REPO_ROOT/src/environments/environment.ts"; then
    record SEC-TEMPKEY WARN 0 medium "environment.ts ships a non-empty 'genearate_tempkey' value to every browser (value not printed). If it protects /images/temp it is not secret; decide and rotate if it is" "src/environments/environment.ts"
  fi
  return 0
}

# After --repair re-runs a diagnostic as "<id>.post": if it now passes, the original FAIL row is re-labelled FIXED
# (evidence that the repair worked, from a real re-run - not an assumption).
mark_fixed() {
  local tmp="$CHECKS_TSV.tmp"
  awk -F'\t' -v OFS='\t' '
    NR==FNR { if ($1 ~ /\.post$/ && $2=="PASS") ok[substr($1,1,length($1)-5)]=1; next }
    ($2=="FAIL" && ($1 in ok)) { $2="FIXED"; $6="re-verified after --repair (" $1 ".post PASS); was: " $6 }
    { print }' "$CHECKS_TSV" "$CHECKS_TSV" >"$tmp" && mv "$tmp" "$CHECKS_TSV"
  return 0
}

# ============================================================================ REPAIRS
# repair_replace ID RELPATH OLD NEW   (exact, single-occurrence, idempotent)
# Order matters: classify first (already applied? ambiguous?), only then check for user changes.
repair_replace() {
  local id="$1" relp="$2" old="$3" new="$4" abs="$REPO_ROOT/$2" mode="apply" rc sha_before sha_after out
  (( DO_DRY )) && mode="dry"
  mkdir -p "$REPORT_DIR/patches"
  if [[ ! -f "$abs" ]]; then
    record "REPAIR-$id" FAIL 1 medium "target file missing: $relp"; printf '%s\t%s\t%s\t-\t-\n' "$id" "$relp" "missing" >>"$REPAIR_TSV"; return 0
  fi
  sha_before="$(sha256sum "$abs" | awk '{print $1}')"
  # python modes: probe (classify only) | dry (print diff) | apply (print diff + write atomically, keep mode)
  # exit: 0 ok | 10 already applied | 11 expected text not found exactly once
  set +e
  python3 -I - "$abs" "$old" "$new" probe "$REPORT_DIR/patches/$id.diff" "$relp" <<'PYEOF' >/dev/null
import difflib, os, shutil, sys, tempfile
path, old, new, mode, diffout, relp = sys.argv[1:7]
data = open(path, encoding='utf-8').read()
n_old, n_new = data.count(old), data.count(new)
if n_old == 0 and n_new >= 1: sys.exit(10)
if n_old != 1: sys.exit(11)
if mode == 'probe': sys.exit(0)
updated = data.replace(old, new, 1)
diff = ''.join(difflib.unified_diff(data.splitlines(True), updated.splitlines(True), 'a/' + relp, 'b/' + relp, n=2))
open(diffout, 'w').write(diff)
print(diff.rstrip())
if mode == 'dry': sys.exit(0)
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), prefix='.fft-')
with os.fdopen(fd, 'w', encoding='utf-8') as f: f.write(updated)
shutil.copymode(path, tmp)
os.replace(tmp, path)
PYEOF
  rc=$?
  set -e
  if (( rc == 10 )); then
    record "REPAIR-$id" PASS 1 info "already applied: $relp (nothing to do)"
    printf '%s\t%s\t%s\t%s\t%s\n' "$id" "$relp" "already-applied" "$sha_before" "$sha_before" >>"$REPAIR_TSV"; return 0
  elif (( rc == 11 )); then
    record "REPAIR-$id" BLOCKED 1 medium "unexpected content in $relp (original text not found exactly once); refusing an ambiguous patch"
    printf '%s\t%s\t%s\t%s\t-\n' "$id" "$relp" "refused-unexpected-content" "$sha_before" >>"$REPAIR_TSV"; return 0
  elif (( rc != 0 )); then
    record "REPAIR-$id" FAIL 1 high "repair engine error (rc=$rc) on $relp"; printf '%s\t%s\t%s\t%s\t-\n' "$id" "$relp" "error" "$sha_before" >>"$REPAIR_TSV"; return 0
  fi
  if ! git -C "$REPO_ROOT" diff --quiet HEAD -- "$relp" 2>/dev/null; then
    record "REPAIR-$id" BLOCKED 1 medium "$relp has uncommitted changes; refusing to touch it (commit or stash them, then re-run)"
    printf '%s\t%s\t%s\t%s\t-\n' "$id" "$relp" "refused-dirty" "$sha_before" >>"$REPAIR_TSV"; return 0
  fi
  set +e
  out="$(python3 -I - "$abs" "$old" "$new" "$mode" "$REPORT_DIR/patches/$id.diff" "$relp" <<'PYEOF'
import difflib, os, shutil, sys, tempfile
path, old, new, mode, diffout, relp = sys.argv[1:7]
data = open(path, encoding='utf-8').read()
n_old, n_new = data.count(old), data.count(new)
if n_old == 0 and n_new >= 1: sys.exit(10)
if n_old != 1: sys.exit(11)
if mode == 'probe': sys.exit(0)
updated = data.replace(old, new, 1)
diff = ''.join(difflib.unified_diff(data.splitlines(True), updated.splitlines(True), 'a/' + relp, 'b/' + relp, n=2))
open(diffout, 'w').write(diff)
print(diff.rstrip())
if mode == 'dry': sys.exit(0)
fd, tmp = tempfile.mkstemp(dir=os.path.dirname(path), prefix='.fft-')
with os.fdopen(fd, 'w', encoding='utf-8') as f: f.write(updated)
shutil.copymode(path, tmp)
os.replace(tmp, path)
PYEOF
)"
  rc=$?
  set -e
  say "$out"
  if (( rc != 0 )); then
    record "REPAIR-$id" FAIL 1 high "repair engine error (rc=$rc) on $relp"; printf '%s\t%s\t%s\t%s\t-\n' "$id" "$relp" "error" "$sha_before" >>"$REPAIR_TSV"; return 0
  fi
  if (( DO_DRY )); then
    record "REPAIR-$id" PASS 0 info "dry-run: would patch $relp (diff saved in patches/$id.diff)"
    printf '%s\t%s\t%s\t%s\t-\n' "$id" "$relp" "dry-run" "$sha_before" >>"$REPAIR_TSV"
  else
    sha_after="$(sha256sum "$abs" | awk '{print $1}')"
    if [[ "$sha_after" == "$sha_before" ]]; then record "REPAIR-$id" FAIL 1 high "patch reported success but $relp is unchanged"; return 0; fi
    record "REPAIR-$id" PASS 1 info "patched $relp (original saved in backup/$relp)"
    printf '%s\t%s\t%s\t%s\t%s\n' "$id" "$relp" "applied" "$sha_before" "$sha_after" >>"$REPAIR_TSV"
  fi
  return 0
}

backup_file() { # relpath -> copy with mode/timestamps preserved; verifies the copy by sha256
  local relp="$1" dst="$BACKUP_DIR/$1"
  mkdir -p "$(dirname "$dst")"
  [[ -e "$dst" ]] || cp -p "$REPO_ROOT/$relp" "$dst"
  [[ "$(sha256sum "$dst" | awk '{print $1}')" == "$(sha256sum "$REPO_ROOT/$relp" | awk '{print $1}')" ]]
}

do_repairs() {
  say "== Repairs ($( (( DO_DRY )) && echo dry-run || echo apply ))"
  local envfile oldtype='https://192.168.0.140:8183f/rontend-error' newtype='https://192.168.0.140:8183/frontend-error'
  local oldlit='return `${environment.expose_image}/${relativePath}`;' newlit='return `${environment.expose_image.local_images}/${relativePath}`;'

  # Evidence: the API mounts POST /frontend-error (nodejs_middleware index.js); environment.ts already
  # declares frontendErrorEndpoint '/frontend-error'; the sibling URL on the next line is ...:8183/frontend-metrics.
  # Evidence: ImageService.getProductUrl builds image URLs from environment.expose_image.local_images.
  local -a targets=(
    "ENV-ERRURL-1|src/environments/environment.ts|$oldtype|$newtype"
    "ENV-ERRURL-2|src/environments/environment.development.ts|$oldtype|$newtype"
    "IMG-OBJ-1|src/app/Images/image.service.ts|$oldlit|$newlit"
    "IMG-OBJ-2|src/app/Tables/product-list/product-list.component.ts|$oldlit|$newlit"
  )
  local t id relp old new
  # back everything up first; abort the whole repair if any backup fails
  if (( DO_REPAIR )); then
    for t in "${targets[@]}"; do
      IFS='|' read -r id relp old new <<<"$t"
      [[ -f "$REPO_ROOT/$relp" ]] || continue
      git -C "$REPO_ROOT" diff --quiet HEAD -- "$relp" 2>/dev/null || continue   # dirty files are refused later, not copied
      if ! backup_file "$relp"; then record REPAIR-BACKUP FAIL 1 high "backup of $relp failed or does not match; no repair was applied"; return 0; fi
    done
  fi
  for t in "${targets[@]}"; do
    IFS='|' read -r id relp old new <<<"$t"
    repair_replace "$id" "$relp" "$old" "$new"
  done
  say "Not auto-repaired (needs a code decision/review): IMG-UNKNOWN-PRODUCT, API-USERID-HEADER, IMG-UNDERSCORE-HOST, deploy files, certificates."
  return 0
}

# ============================================================================ INSTALL / BUILD / TEST
run_logged() { # name cmd... ; stores rc in RUN_RC, log in $REPORT_DIR/<name>.log
  local name="$1"; shift
  say "\$ $*   (log: $name.log)"
  set +e
  ( cd "$REPO_ROOT" && "$@" ) >"$REPORT_DIR/$name.log" 2>&1
  RUN_RC=$?
  set -e
  sanitize <"$REPORT_DIR/$name.log" >"$REPORT_DIR/$name.log.tmp" && mv "$REPORT_DIR/$name.log.tmp" "$REPORT_DIR/$name.log"
}

deps_ready() { [[ -d "$REPO_ROOT/node_modules/@angular/core" && -x "$REPO_ROOT/node_modules/.bin/ng" ]]; }

do_install() {
  say "== Install"
  if deps_ready; then
    record INSTALL SKIP 0 info "node_modules already present; NOT reinstalling (npm ci would delete it)"
    return 0
  fi
  if [[ -e "$REPO_ROOT/node_modules" ]] && [[ -n "$(ls -A "$REPO_ROOT/node_modules" 2>/dev/null)" ]]; then
    record INSTALL BLOCKED 1 medium "node_modules exists but is incomplete; refusing to let 'npm ci' delete it. Move it aside yourself, then re-run" ""
    return 0
  fi
  run_logged npm-ci npm ci --no-audit --no-fund
  if (( RUN_RC == 0 )); then record INSTALL PASS 1 info "npm ci succeeded"
  else
    local why="npm ci failed (exit $RUN_RC)"
    grep -qE "ENOTFOUND|EAI_AGAIN|ETIMEDOUT|403 Forbidden|E403" "$REPORT_DIR/npm-ci.log" && why+="; looks like registry/network access (environmental, not a code defect)"
    record INSTALL BLOCKED 1 high "$why" "$(tail -3 "$REPORT_DIR/npm-ci.log")"
  fi
  return 0
}

do_build() {
  say "== Production build"
  if ! deps_ready; then record BUILD BLOCKED 1 high "cannot build: dependencies not installed (use --install or npm ci)" ""; return 0; fi
  local out="$REPORT_DIR/build-out"
  run_logged ng-build npx --no-install ng build --configuration=production --output-path "$out"
  if (( RUN_RC != 0 )); then
    record BUILD FAIL 1 high "ng build --configuration=production failed (exit $RUN_RC)" "$(grep -E 'ERROR|error TS|Error:' "$REPORT_DIR/ng-build.log" | head -5)"
    return 0
  fi
  if [[ -f "$out/index.html" ]]; then record BUILD PASS 1 info "production build ok -> $out (angular.json outputPath not touched; ./dist unchanged)"
  else record BUILD FAIL 1 high "build exited 0 but index.html not found in $out"; return 0; fi
  grep -q '<base href="/">' "$out/index.html" && record BUILD-BASEHREF PASS 0 info "base href is '/' (app must be served from the site root)" \
    || record BUILD-BASEHREF WARN 0 medium "unexpected base href: $(grep -o '<base[^>]*>' "$out/index.html" | head -1)"
  local d hits=""
  for d in "${STALE_DOMAINS[@]}"; do
    n="$(grep -lF "$d" "$out"/*.js 2>/dev/null | wc -l | tr -d ' ')"; (( n > 0 )) && hits+="$d in $n bundle file(s); "
  done
  [[ -z "$hits" ]] && record BUILD-STALE PASS 1 info "no obsolete domain in built bundles" || record BUILD-STALE FAIL 1 high "obsolete domain in built bundle" "$hits"
  n="$(grep -ohE '192\.168\.[0-9]+\.[0-9]+' "$out"/*.js 2>/dev/null | sort -u | tr '\n' ' ')"
  [[ -n "$n" ]] && record BUILD-PRIVATE-IP WARN 0 medium "built bundle embeds private LAN address(es): $n" ""
  if grep -q '\[object Object\]' "$out"/*.js 2>/dev/null; then record BUILD-OBJECT-STRING WARN 0 low "literal '[object Object]' text in bundle (may be library code; inspect)" ""; fi
  return 0
}

do_test() {
  say "== Unit tests"
  if ! deps_ready; then record TEST-UNIT BLOCKED 1 high "cannot test: dependencies not installed" ""; return 0; fi
  local chrome="${CHROME_BIN:-}"
  [[ -z "$chrome" ]] && for c in google-chrome google-chrome-stable chromium chromium-browser; do command -v "$c" >/dev/null 2>&1 && { chrome="$(command -v "$c")"; break; }; done
  if [[ -z "$chrome" ]]; then record TEST-UNIT BLOCKED 1 high "no Chrome/Chromium found (set CHROME_BIN); Karma cannot run" ""; return 0; fi
  [[ "$(id -u)" == 0 ]] && record TEST-ROOT WARN 0 low "running as root: headless Chrome normally refuses without --no-sandbox and the repo has no karma.conf; a failure below may be sandbox-related"
  export CHROME_BIN="$chrome"
  run_logged ng-test npx --no-install ng test --watch=false --browsers=ChromeHeadless --no-progress
  local summary; summary="$(grep -E 'Executed [0-9]+ of [0-9]+' "$REPORT_DIR/ng-test.log" | tail -1)"
  if (( RUN_RC == 0 )); then record TEST-UNIT PASS 1 info "ng test passed" "$summary"
  else record TEST-UNIT FAIL 1 high "ng test failed (exit $RUN_RC)" "${summary:-$(tail -3 "$REPORT_DIR/ng-test.log")}"; fi
  return 0
}

# ============================================================================ NETWORK CHECKS (read-only)
net_checks() {
  say "== Connectivity (read-only requests)"
  local pre="$REPORT_DIR/net" why
  mkdir -p "$pre"
  if [[ -n "${SWEETY_API_TOKEN:-}" && -n "$API_URL" ]]; then
    if [[ "$API_URL" == https://* ]]; then
      AUTH_HDR_FILE="$(mktemp)"; chmod 600 "$AUTH_HDR_FILE"; printf 'Authorization: Bearer %s\n' "$SWEETY_API_TOKEN" >"$AUTH_HDR_FILE"
    else record NET-TOKEN WARN 0 medium "SWEETY_API_TOKEN set but --api-url is not https; token NOT sent (would be cleartext)"; fi
  fi

  if [[ -n "$API_URL" ]]; then
    # GET / exists in nodejs_middleware/index.js (app.get("/")); GET /api/v1/student/getProductList is a verified route (studentsRoutes.js).
    http_probe "$API_URL/" "$pre/api-root"
    if (( PROBE_RC != 0 )); then record API-ROOT FAIL 1 high "GET $API_URL/ failed: $(explain_curl_rc $PROBE_RC)" "$(head -c 200 "$pre/api-root.err")"
    elif [[ "$PROBE_CODE" == 200 ]]; then record API-ROOT PASS 1 info "GET / -> 200 ($PROBE_CT)"
    else record API-ROOT FAIL 1 high "GET / -> HTTP $PROBE_CODE" "$PROBE_CT"; fi

    http_probe "$API_URL/api/v1/student/getProductList" "$pre/api-products"
    if (( PROBE_RC != 0 )); then record API-PRODUCTS FAIL 1 high "GET getProductList failed: $(explain_curl_rc $PROBE_RC)" "$(head -c 200 "$pre/api-products.err")"
    elif [[ "$PROBE_CODE" == 401 || "$PROBE_CODE" == 403 ]]; then
      record API-PRODUCTS BLOCKED 1 medium "getProductList reachable but requires authentication (HTTP $PROBE_CODE); set SWEETY_API_TOKEN to validate the data. Reachability proven, contract NOT validated" ""
    elif [[ "$PROBE_CODE" == 200 ]]; then
      if python3 -I -c 'import json,sys; json.load(open(sys.argv[1]))' "$pre/api-products.body" 2>/dev/null; then
        record API-PRODUCTS PASS 1 info "getProductList -> 200 with valid JSON ($PROBE_CT, $(wc -c <"$pre/api-products.body") bytes). Field-level contract not asserted (shape handled by ResponseUtils.extractFirstArrayFromNested)"
      else record API-PRODUCTS FAIL 1 high "getProductList -> 200 but body is not JSON" "$PROBE_CT"; fi
    else record API-PRODUCTS FAIL 1 high "getProductList -> HTTP $PROBE_CODE" "$PROBE_CT"; fi
  else
    record API-CHECKS SKIP 0 info "no --api-url given: API checks not executed (URL is never guessed)"
  fi

  if [[ -n "$FRONTEND_URL" ]]; then
    http_probe "$FRONTEND_URL/" "$pre/fe-root"
    if (( PROBE_RC != 0 )); then record FE-ROOT FAIL 1 high "GET $FRONTEND_URL/ failed: $(explain_curl_rc $PROBE_RC)" "$(head -c 200 "$pre/fe-root.err")"
    elif [[ "$PROBE_CODE" == 200 && "$PROBE_CT" == text/html* ]] && grep -q 'sweet-app-root' "$pre/fe-root.body"; then
      record FE-ROOT PASS 1 info "frontend index served (200, $PROBE_CT, contains <sweet-app-root>)"
      local js; js="$(grep -oE 'src="(main\.[A-Za-z0-9]+\.js)"' "$pre/fe-root.body" | head -1 | sed -E 's/src="(.*)"/\1/')"
      if [[ -n "$js" ]]; then
        http_probe "$FRONTEND_URL/$js" "$pre/fe-main"
        if [[ "$PROBE_CODE" == 200 && "$PROBE_CT" == *javascript* ]]; then record FE-BUNDLE PASS 1 info "main bundle $js -> 200 ($PROBE_CT)"
        else record FE-BUNDLE FAIL 1 high "main bundle $js -> HTTP $PROBE_CODE, content-type '$PROBE_CT' (HTML here means a broken asset path/SPA fallback)"; fi
      else record FE-BUNDLE WARN 1 medium "index.html has no main.<hash>.js script tag (non-standard build?)"; fi
    else record FE-ROOT FAIL 1 high "frontend root -> HTTP $PROBE_CODE, '$PROBE_CT' or app root element missing"; fi
    http_probe "$FRONTEND_URL/__spa_probe__/deep/link" "$pre/fe-spa"
    if [[ "$PROBE_CODE" == 200 && "$PROBE_CT" == text/html* ]]; then record FE-SPA-FALLBACK PASS 1 info "deep link returns index.html (SPA fallback works)"
    else record FE-SPA-FALLBACK FAIL 1 medium "deep link -> HTTP $PROBE_CODE ($PROBE_CT): refresh/direct navigation will 404"; fi
  else
    record FE-CHECKS SKIP 0 info "no --frontend-url given: served-frontend checks not executed"
  fi

  # Fallback image URL comes from repo config (not guessed).
  if [[ -n "$API_URL$FRONTEND_URL" ]]; then
    local fb; fb="$(grep -E "fallbackImage:" "$REPO_ROOT/src/environments/environment.ts" | head -1 | sed -E "s/.*fallbackImage:[[:space:]]*['\"]([^'\"]+)['\"].*/\1/")"
    if [[ "$fb" =~ ^https?:// ]]; then
      http_probe "$fb" "$pre/fallback-img"
      if (( PROBE_RC != 0 )); then record IMG-FALLBACK FAIL 1 high "fallback image $fb unreachable: $(explain_curl_rc $PROBE_RC)" ""
      else
        local magic; magic="$(head -c 12 "$pre/fallback-img.body" | od -An -c | tr -d ' \n')"
        local fmt="unknown"
        [[ "$magic" == RIFF*WEBP* ]] && fmt=webp; [[ "$magic" == GIF8* ]] && fmt=gif; [[ "$magic" == *PNG* ]] && fmt=png; [[ "$magic" == 377330377* ]] && fmt=jpeg
        if [[ "$PROBE_CODE" == 200 && "$PROBE_CT" == image/* && "$fmt" != unknown ]]; then
          record IMG-FALLBACK PASS 1 info "fallback image -> 200, $PROBE_CT, real $fmt data (HTTP + MIME + bytes verified; browser rendering NOT verified)"
        else record IMG-FALLBACK FAIL 1 high "fallback image -> HTTP $PROBE_CODE, content-type '$PROBE_CT', bytes look like '$fmt' (HTML/JSON instead of an image?)" "$fb"; fi
      fi
    fi
    record IMG-BROWSER-RENDER SKIP 0 info "actual in-browser rendering is not executed by this script (needs a browser automation tool); curl success does not prove rendering"
  fi
  return 0
}

# ============================================================================ MAIN
say "Sweety Sweet fix-and-test v$VERSION  repo=$REPO_ROOT"
say "report dir: $REPORT_DIR"
preflight
diag_static
if (( DO_DRY || DO_REPAIR )); then
  do_repairs
  if (( DO_REPAIR )); then diag_defects ".post"; mark_fixed; fi
fi
if (( DO_INSTALL )); then do_install; fi
if (( DO_BUILD )); then do_build; fi
if (( DO_TEST )); then do_test; fi
if [[ -n "$API_URL$FRONTEND_URL" ]]; then net_checks; fi
finish
