#!/usr/bin/env bash
# =============================================================================
# upgrade_sweety_sweet_images.sh
#
# Integrates image upload into Add New, a "Details & image" editor into the live
# Edit tab, the rewritten ImageViewer / EditImageViewer, and fixes the confirmed
# defects (see --help). Nothing is committed, pushed or deployed.
# Self-contained: the exact, tested change set is embedded at the end of this
# file and pinned by SHA-256 (PAYLOAD_SHA256).
#
# Modes:  --audit | --dry-run | --apply | --verify | --restore [ID] | --help
# Safety: backups live OUTSIDE the repo; manifest records paths/hashes/modes;
#         never runs git reset/clean/checkout/commit/push; never deploys.
# =============================================================================
set -Eeuo pipefail
umask 077

readonly SCRIPT_VERSION="2.0.0"
readonly UPGRADE_NAME="sweety-sweet-images"
readonly EXPECTED_BASE_COMMIT="83a3fee216602215929ee2b6711d21e445af320a"
readonly PAYLOAD_SHA256="c24975fb64b7bbf59dd22ca46ab5d3eef6b333195c7bcd5a6f0765c72461fb58"

# exit codes
readonly E_OK=0 E_USAGE=1 E_PREREQ=2 E_NOREPO=3 E_CONFLICT=4 E_APPLY=5 E_RESTORE=6 E_VERIFY=7 E_LOCK=8

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}")"
MODE=""; RESTORE_ID=""; REPO=""; RUN_BUILD=0; RUN_TESTS=0; BACKUP_ROOT=""
WORK="" ; LOG_FILE=""

usage() {
  cat <<'EOF'
Usage: scripts/upgrade_sweety_sweet_images.sh <mode> [options]

Modes (exactly one):
  --audit            Read-only report: prerequisites, git state, per-file status
                     (pristine / already-upgraded / user-modified / missing).
  --dry-run          Show what --apply would back up, patch and create. Writes nothing
                     to the repo or backup area.
  --apply            Back up originals, apply the change set, verify result hashes.
                     Safe to re-run: reports "already applied" and does nothing.
  --verify           Check the repo matches the upgrade; type-check (tsc) when
                     node_modules exists. Add --build and/or --test for more.
  --restore [ID]     Undo THIS upgrade only (default: newest applied/interrupted run). Files
                     changed by you after --apply are reported as conflicts and left untouched.
  --self-test        Proves apply/idempotency/verify/conflict-detection/restore on a throw-away
                     clone of HEAD. Never touches your working tree. Run this first.
  --help             This text.

Options:
  --repo PATH        Repo root (default: auto-detected: script dir, its parent, or the current git repo).
  --backup-root DIR  Where backups/manifests/logs go (default: <repo>/../sweety-sweet-v1.upgrade-backups,
                     must be outside the repo). Env: SWEETY_BACKUP_ROOT.
  --build            (--verify) also run: ng build --configuration=development
  --test             (--verify) also run the new unit specs (Images, Edit form, product edit path)
                     in headless Chrome
                     (needs Chrome: set CHROME_BIN or install chromium/google-chrome).

Exit codes: 0 ok | 1 usage | 2 prerequisite missing | 3 not a git repo | 4 conflict / partial
            state | 5 apply failed (auto-rolled back) | 6 restore conflict | 7 verify failed | 8 locked
EOF
}

# ---------- logging ----------------------------------------------------------
ts() { date +"%Y-%m-%dT%H:%M:%S%z"; }
log() { local m="[$(ts)] $*"; echo "$m"; [[ -n "$LOG_FILE" ]] && echo "$m" >>"$LOG_FILE" || true; }
die() { local code="$1"; shift; log "ERROR: $*"; exit "$code"; }

cleanup() { [[ -n "${WORK:-}" && -d "$WORK" ]] && rm -rf "$WORK"; return 0; }
trap cleanup EXIT

# ---------- argument parsing -------------------------------------------------
[[ $# -eq 0 ]] && { usage; exit $E_USAGE; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --audit|--dry-run|--apply|--verify|--self-test|--help)
      [[ -n "$MODE" ]] && { echo "Only one mode allowed" >&2; exit $E_USAGE; }
      MODE="${1#--}" ;;
    --restore)
      [[ -n "$MODE" ]] && { echo "Only one mode allowed" >&2; exit $E_USAGE; }
      MODE="restore"
      if [[ $# -gt 1 && "$2" != --* ]]; then RESTORE_ID="$2"; shift; fi ;;
    --repo) REPO="${2:?--repo needs a path}"; shift ;;
    --backup-root) BACKUP_ROOT="${2:?--backup-root needs a path}"; shift ;;
    --build) RUN_BUILD=1 ;;
    --test) RUN_TESTS=1 ;;
    -h) MODE="help" ;;
    *) echo "Unknown argument: $1" >&2; usage >&2; exit $E_USAGE ;;
  esac
  shift
done
[[ "$MODE" == "help" ]] && { usage; exit $E_OK; }
[[ -z "$MODE" ]] && { usage; exit $E_USAGE; }

# ---------- prerequisites ----------------------------------------------------
die_early() { echo "ERROR: $*" >&2; exit 2; }
need() { command -v "$1" >/dev/null 2>&1 || die $E_PREREQ "Required tool not found: $1"; }
for t in git sha256sum tar base64 sed awk cp stat mkdir date readlink; do need "$t"; done

if [[ -z "$REPO" ]]; then
  for cand in "$(dirname "$SCRIPT_PATH")" "$(dirname "$SCRIPT_PATH")/.." "$PWD"; do
    if [[ -f "$cand/angular.json" && -d "$cand/src/app" ]]; then REPO="$(cd "$cand" && pwd)"; break; fi
  done
  [[ -z "$REPO" ]] && die_early "Could not find the Angular repo (angular.json + src/app). Use --repo PATH."
fi
REPO="$(readlink -f "$REPO")"
git -C "$REPO" rev-parse --show-toplevel >/dev/null 2>&1 || die $E_NOREPO "Not a git repository: $REPO"
TOP="$(readlink -f "$(git -C "$REPO" rev-parse --show-toplevel)")"
[[ "$TOP" == "$REPO" ]] || die $E_NOREPO "--repo must be the repository root ($TOP)"
[[ -f "$REPO/angular.json" && -d "$REPO/src/app" ]] || die $E_PREREQ "Does not look like the Sweety Sweet Angular repo (angular.json / src/app missing)"

[[ -z "$BACKUP_ROOT" ]] && BACKUP_ROOT="${SWEETY_BACKUP_ROOT:-$(dirname "$REPO")/$(basename "$REPO").upgrade-backups}"
mkdir -p "$BACKUP_ROOT"; BACKUP_ROOT="$(readlink -f "$BACKUP_ROOT")"
case "$BACKUP_ROOT/" in "$REPO"/*) die $E_PREREQ "Backup root must be OUTSIDE the repo (your git auto-push would commit it): $BACKUP_ROOT";; esac
mkdir -p "$BACKUP_ROOT/logs"
LOG_FILE="$BACKUP_ROOT/logs/${UPGRADE_NAME}_$(date +%Y%m%d_%H%M%S)_${MODE}.log"
: >"$LOG_FILE"
log "$UPGRADE_NAME v$SCRIPT_VERSION  mode=$MODE  repo=$REPO"

# ---------- payload ----------------------------------------------------------
WORK="$(mktemp -d)"
extract_payload() {
  sed -n '/^__PAYLOAD_BELOW__$/,$p' "$SCRIPT_PATH" | tail -n +2 >"$WORK/payload.b64"
  local got; got="$(sha256sum "$WORK/payload.b64" | awk '{print $1}')"
  [[ "$got" == "$PAYLOAD_SHA256" ]] || die $E_PREREQ "Embedded payload is corrupt or edited (sha256 $got != $PAYLOAD_SHA256)"
  mkdir -p "$WORK/p"; base64 -d "$WORK/payload.b64" | tar -xz -C "$WORK/p"
  [[ -f "$WORK/p/changes.patch" && -f "$WORK/p/files.tsv" && -f "$WORK/p/expected.sha256" ]] || die $E_PREREQ "Payload is incomplete"
}
extract_payload
PATCH="$WORK/p/changes.patch"; FILES="$WORK/p/files.tsv"; EXPECT="$WORK/p/expected.sha256"

sha_of()   { sha256sum "$1" | awk '{print $1}'; }
mode_of()  { stat -c '%a' "$1"; }
expected_sha() { awk -v f="$1" '$2==f {print $1}' "$EXPECT"; }
head_blob_sha() { # sha256 of the file as committed in HEAD ("" if not in HEAD)
  git -C "$REPO" cat-file -e "HEAD:$1" 2>/dev/null && git -C "$REPO" show "HEAD:$1" | sha256sum | awk '{print $1}' || true
}

# classify one file: pristine | upgraded | modified | missing | exists-other
classify() { # $1 kind (M|N)  $2 relpath
  local kind="$1" rel="$2" abs="$REPO/$2" exp cur base
  exp="$(expected_sha "$rel")"
  if [[ ! -e "$abs" ]]; then echo "missing"; return; fi
  cur="$(sha_of "$abs")"
  [[ "$cur" == "$exp" ]] && { echo "upgraded"; return; }
  if [[ "$kind" == "M" ]]; then
    base="$(head_blob_sha "$rel")"
    [[ "$cur" == "$base" ]] && echo "pristine" || echo "modified"
  else
    echo "exists-other"
  fi
}

SUMMARY_PRISTINE=0; SUMMARY_UPGRADED=0; SUMMARY_BAD=0; TOTAL=0
survey() { # prints table, fills counters
  SUMMARY_PRISTINE=0; SUMMARY_UPGRADED=0; SUMMARY_BAD=0; TOTAL=0
  while IFS=$'\t' read -r kind rel; do
    [[ -z "$kind" ]] && continue
    local st; st="$(classify "$kind" "$rel")"; TOTAL=$((TOTAL+1))
    case "$kind:$st" in
      M:pristine|N:missing) SUMMARY_PRISTINE=$((SUMMARY_PRISTINE+1)); log "  [$kind] $st  $rel" ;;
      *:upgraded)           SUMMARY_UPGRADED=$((SUMMARY_UPGRADED+1)); log "  [$kind] already-upgraded  $rel" ;;
      *)                    SUMMARY_BAD=$((SUMMARY_BAD+1)); log "  [$kind] $st  $rel   <-- differs from what the upgrade expects" ;;
    esac
  done <"$FILES"
}

acquire_lock() {
  LOCKDIR="$BACKUP_ROOT/.lock"
  if ! mkdir "$LOCKDIR" 2>/dev/null; then
    local oldpid; oldpid="$(cat "$LOCKDIR/pid" 2>/dev/null || true)"
    if [[ -n "$oldpid" ]] && ! kill -0 "$oldpid" 2>/dev/null; then
      log "Removing stale lock from dead process $oldpid"
      rm -rf "$LOCKDIR"; mkdir "$LOCKDIR" 2>/dev/null || die $E_LOCK "Could not take lock $LOCKDIR"
    else
      die $E_LOCK "Another run (pid ${oldpid:-unknown}) holds $LOCKDIR"
    fi
  fi
  echo "$$" >"$LOCKDIR/pid"
  trap 'rm -rf "$LOCKDIR" 2>/dev/null || true; cleanup' EXIT
}

# Interrupt safety: if Ctrl-C / SIGTERM arrives while applying, roll back this run.
IN_APPLY=0; CURRENT_MAN=""
on_signal() {
  log "Interrupted by signal."
  if [[ $IN_APPLY -eq 1 && -n "$CURRENT_MAN" ]]; then
    log "Rolling back the partial apply from backup..."
    restore_from_manifest "$CURRENT_MAN" "auto-rollback" || true
  fi
  exit 130
}
trap on_signal INT TERM HUP

# ---------- modes ------------------------------------------------------------
do_audit() {
  log "Repo HEAD: $(git -C "$REPO" rev-parse HEAD)  (upgrade built against $EXPECTED_BASE_COMMIT)"
  [[ "$(git -C "$REPO" rev-parse HEAD)" == "$EXPECTED_BASE_COMMIT" ]] || log "NOTE: HEAD differs from the audited commit; per-file hash checks below are what actually gate --apply."
  log "Branch: $(git -C "$REPO" rev-parse --abbrev-ref HEAD)"
  local dirty; dirty="$(git -C "$REPO" status --porcelain | wc -l)"
  log "Working tree: $dirty changed/untracked path(s) (these are never touched unless listed below)"
  git -C "$REPO" status --porcelain | sed 's/^/    /' | tee -a "$LOG_FILE" | head -40 || true
  log "Files in this upgrade ($(wc -l <"$FILES")):"
  survey
  log "Summary: pristine/new=$SUMMARY_PRISTINE  already-upgraded=$SUMMARY_UPGRADED  conflicting=$SUMMARY_BAD  total=$TOTAL"
  if   [[ $SUMMARY_BAD -gt 0 ]];      then log "RESULT: conflicts present; --apply would refuse."; return $E_CONFLICT
  elif [[ $SUMMARY_UPGRADED -eq $TOTAL ]]; then log "RESULT: upgrade already applied."
  elif [[ $SUMMARY_UPGRADED -gt 0 ]]; then log "RESULT: PARTIAL state (some files upgraded, some not); --apply would refuse."; return $E_CONFLICT
  else log "RESULT: ready to apply."; fi
  [[ -d "$REPO/node_modules" ]] && log "node_modules: present" || log "node_modules: absent (run 'npm ci' before --verify --build/--test)"
  return 0
}

check_patch_applies() { git -C "$REPO" apply --check --whitespace=nowarn "$PATCH"; }

do_dry_run() {
  survey
  [[ $SUMMARY_BAD -gt 0 ]] && die $E_CONFLICT "Conflicts: files differ from what the upgrade expects (see above). Nothing would be changed."
  if [[ $SUMMARY_UPGRADED -eq $TOTAL ]]; then log "DRY-RUN: already applied; --apply would do nothing."; return 0; fi
  [[ $SUMMARY_UPGRADED -gt 0 ]] && die $E_CONFLICT "Partial state detected; refusing."
  check_patch_applies || die $E_CONFLICT "git apply --check failed; patch does not apply cleanly."
  log "DRY-RUN: would back up to: $BACKUP_ROOT/<timestamp>_$UPGRADE_NAME/"
  while IFS=$'\t' read -r kind rel; do
    [[ "$kind" == "M" ]] && log "  would back up + modify  $rel" || log "  would create            $rel"
  done <"$FILES"
  log "DRY-RUN OK: nothing was written to the repo."
}

do_apply() {
  acquire_lock
  survey
  if [[ $SUMMARY_BAD -gt 0 ]]; then
    log "Hint: inspect with  git -C '$REPO' diff -- <file>   (HEAD may have moved since the audit; send the current files if so)"
    die $E_CONFLICT "Refusing: your copy of some files differs from the audited baseline (nothing changed)."
  fi
  if [[ $SUMMARY_UPGRADED -eq $TOTAL ]]; then log "Already applied; nothing to do."; return 0; fi
  [[ $SUMMARY_UPGRADED -gt 0 ]] && die $E_CONFLICT "Partial state detected (some files already upgraded). Use --restore first, or inspect manually."
  check_patch_applies || die $E_CONFLICT "git apply --check failed; nothing changed."

  local id; id="$(date +%Y%m%d_%H%M%S)-$$_$UPGRADE_NAME"
  local bdir="$BACKUP_ROOT/$id"; mkdir -p "$bdir/files"
  local man="$bdir/manifest.tsv"
  CURRENT_MAN="$man"; IN_APPLY=1
  {
    echo -e "#meta\tupgrade\t$UPGRADE_NAME\tversion\t$SCRIPT_VERSION"
    echo -e "#meta\trepo\t$REPO"
    echo -e "#meta\tbase_head\t$(git -C "$REPO" rev-parse HEAD)"
    echo -e "#meta\tcreated\t$(ts)"
    echo -e "#meta\tstatus\tINCOMPLETE"
    echo -e "#cols\tkind\trelpath\torig_sha256\torig_mode\texpected_new_sha256"
  } >"$man"
  log "Backup dir: $bdir"

  # 1) back up every file we will modify (preserving mode/timestamps), record hashes
  while IFS=$'\t' read -r kind rel; do
    [[ "$kind" == "M" ]] || continue
    mkdir -p "$bdir/files/$(dirname "$rel")"
    cp -p "$REPO/$rel" "$bdir/files/$rel"
    local osha; osha="$(sha_of "$REPO/$rel")"
    [[ "$(sha_of "$bdir/files/$rel")" == "$osha" ]] || die $E_APPLY "Backup verification failed for $rel"
    echo -e "M\t$rel\t$osha\t$(mode_of "$REPO/$rel")\t$(expected_sha "$rel")" >>"$man"
  done <"$FILES"
  # record new files (and directories we will create) BEFORE creating them
  while IFS=$'\t' read -r kind rel; do
    [[ "$kind" == "N" ]] || continue
    local d; d="$(dirname "$rel")"; [[ -d "$REPO/$d" ]] || echo -e "D\t$d" >>"$man"
    echo -e "N\t$rel\t-\t-\t$(expected_sha "$rel")" >>"$man"
  done <"$FILES"
  log "Manifest written: $man"

  # 2) apply (tracked-file edits via git apply -> working tree only, index untouched)
  rollback_now() {
    log "Rolling back this run's changes from backup..."
    restore_from_manifest "$man" "auto-rollback" || true
  }
  if ! git -C "$REPO" apply --whitespace=nowarn "$PATCH"; then
    rollback_now; die $E_APPLY "git apply failed; rolled back."
  fi
  # 3) create new files
  while IFS=$'\t' read -r kind rel; do
    [[ "$kind" == "N" ]] || continue
    mkdir -p "$REPO/$(dirname "$rel")"
    cp "$WORK/p/new/$rel" "$REPO/$rel"
    chmod 644 "$REPO/$rel"
  done <"$FILES"
  # 4) verify results are byte-identical to the tested change set
  local bad=0
  while IFS=$'\t' read -r kind rel; do
    [[ -z "$kind" ]] && continue
    if [[ "$(sha_of "$REPO/$rel")" != "$(expected_sha "$rel")" ]]; then log "HASH MISMATCH after apply: $rel"; bad=1; fi
  done <"$FILES"
  if [[ $bad -ne 0 ]]; then rollback_now; die $E_APPLY "Post-apply verification failed; rolled back."; fi
  sed -i 's/^#meta\tstatus\tINCOMPLETE$/#meta\tstatus\tAPPLIED/' "$man"
  IN_APPLY=0
  log "APPLIED OK: $(grep -c '^M' "$man") file(s) modified, $(grep -c '^N' "$man") created."
  log "Next: $SCRIPT_PATH --verify --build --test   (undo any time with: --restore $id)"
  log "Reminder: your 4-hourly git auto-push will commit these changes at its next run."
  log "Open question (needs your nginx/ops info): uploads are stored by the middleware in uploads/; images are DISPLAYED from the :3007 image server. See --help."
}

manifest_status() { awk -F'\t' '$1=="#meta" && $2=="status" {print $3}' "$1" 2>/dev/null; }
latest_applied() {
  local m st
  for m in $(ls -1d "$BACKUP_ROOT"/*_"$UPGRADE_NAME" 2>/dev/null | sort -r); do
    st="$(manifest_status "$m/manifest.tsv")"
    [[ "$st" == "APPLIED" || "$st" == "INCOMPLETE" ]] && { basename "$m"; return; }
  done
}

# restore_from_manifest <manifest> <label> ; returns E_RESTORE if any conflict
restore_from_manifest() {
  local man="$1" label="$2" conflicts=0 restored=0 bdir; bdir="$(dirname "$man")"
  local -a dirs=()
  while IFS=$'\t' read -r kind rel osha omode esha; do
    case "$kind" in
      M)
        local cur_abs="$REPO/$rel" cur; cur="-"
        [[ -e "$cur_abs" ]] && cur="$(sha_of "$cur_abs")"
        if [[ "$cur" == "$osha" ]]; then log "  [$label] unchanged-from-original  $rel"; continue; fi
        if [[ "$cur" != "$esha" && "$label" != "auto-rollback" ]]; then
          log "  CONFLICT: $rel was changed after the upgrade (not restoring; your edits are kept)"; conflicts=$((conflicts+1)); continue
        fi
        if [[ "$(sha_of "$bdir/files/$rel")" != "$osha" ]]; then
          log "  CONFLICT: backup of $rel failed hash verification; refusing to restore it"; conflicts=$((conflicts+1)); continue
        fi
        cp -p "$bdir/files/$rel" "$cur_abs"; chmod "$omode" "$cur_abs"
        log "  [$label] restored $rel"; restored=$((restored+1)) ;;
      N)
        local n_abs="$REPO/$rel"
        if [[ ! -e "$n_abs" ]]; then log "  [$label] already absent $rel"; continue; fi
        if [[ "$(sha_of "$n_abs")" == "$esha" || "$label" == "auto-rollback" ]]; then
          rm -f -- "$n_abs"; log "  [$label] removed created file $rel"; restored=$((restored+1))
        else
          log "  CONFLICT: created file $rel was edited after the upgrade (kept)"; conflicts=$((conflicts+1))
        fi ;;
      D) dirs+=("$rel") ;;
    esac
  done < <(grep -v '^#' "$man")
  # remove only directories this run created, and only if now empty
  local d; for d in "${dirs[@]:-}"; do [[ -n "$d" && -d "$REPO/$d" ]] && rmdir "$REPO/$d" 2>/dev/null && log "  removed empty created dir $d" || true; done
  log "Restore summary: restored=$restored conflicts=$conflicts"
  [[ $conflicts -eq 0 ]] || return $E_RESTORE
}

do_restore() {
  acquire_lock
  local id="$RESTORE_ID"
  [[ -z "$id" ]] && id="$(latest_applied)"
  [[ -z "$id" ]] && die $E_RESTORE "No applied run found in $BACKUP_ROOT"
  local man="$BACKUP_ROOT/$id/manifest.tsv"
  [[ -f "$man" ]] || die $E_RESTORE "Manifest not found: $man"
  grep -q "^#meta"$'\t'"upgrade"$'\t'"$UPGRADE_NAME" "$man" || die $E_RESTORE "Manifest belongs to a different upgrade"
  local st label="restore"; st="$(manifest_status "$man")"
  [[ "$st" == "RESTORED" ]] && { log "Run $id is already restored."; return 0; }
  [[ "$st" == "INCOMPLETE" ]] && { label="auto-rollback"; log "Run $id was interrupted (INCOMPLETE): rolling back from its backup."; }
  log "Restoring run $id"
  if restore_from_manifest "$man" "$label"; then
    sed -i 's/^#meta\tstatus\t\(APPLIED\|INCOMPLETE\)$/#meta\tstatus\tRESTORED/' "$man"
    log "RESTORE OK."
  else
    log "RESTORE INCOMPLETE: conflicts above were left untouched; manifest stays APPLIED so you can re-run after resolving."
    return $E_RESTORE
  fi
}

do_verify() {
  local bad=0
  log "Hash check against the tested change set:"
  while IFS=$'\t' read -r kind rel; do
    [[ -z "$kind" ]] && continue
    if [[ -e "$REPO/$rel" && "$(sha_of "$REPO/$rel")" == "$(expected_sha "$rel")" ]]; then log "  ok   $rel"
    else log "  FAIL $rel"; bad=1; fi
  done <"$FILES"
  [[ $bad -eq 0 ]] || die $E_VERIFY "Repo does not match the upgrade (not applied, or edited since)."
  log "Hash check passed."

  if [[ -d "$REPO/node_modules" ]]; then
    need npx
    log "Type-check: tsc -p tsconfig.app.json --noEmit"
    ( cd "$REPO" && npx --no-install tsc -p tsconfig.app.json --noEmit ) >>"$LOG_FILE" 2>&1 \
      && log "  tsc OK" || die $E_VERIFY "tsc reported errors (see $LOG_FILE)"
  else
    log "node_modules missing: skipped tsc/build/tests (run 'npm ci' first)."
    [[ $RUN_BUILD -eq 1 || $RUN_TESTS -eq 1 ]] && die $E_PREREQ "--build/--test need node_modules"
  fi

  if [[ $RUN_BUILD -eq 1 ]]; then
    log "Build: ng build --configuration=development (AOT template check; avoids the Google-Fonts fetch that fails offline)"
    ( cd "$REPO" && NG_CLI_ANALYTICS=false npx --no-install ng build --configuration=development --output-path "$WORK/dist" ) >>"$LOG_FILE" 2>&1 \
      && log "  build OK" || die $E_VERIFY "build failed (see $LOG_FILE)"
  fi

  if [[ $RUN_TESTS -eq 1 ]]; then
    local chrome="${CHROME_BIN:-}"
    [[ -z "$chrome" ]] && for c in chromium chromium-browser google-chrome google-chrome-stable; do command -v "$c" >/dev/null 2>&1 && { chrome="$(command -v "$c")"; break; }; done
    [[ -n "$chrome" ]] || die $E_PREREQ "--test needs Chrome: set CHROME_BIN"
    # The repo's full spec compile currently fails on unrelated stale specs, so we
    # run only the Images specs through a throw-away tsconfig/karma config kept outside the repo.
    cat >"$WORK/tsconfig.images.json" <<EOF
{ "extends": "$REPO/tsconfig.json",
  "compilerOptions": { "outDir": "$WORK/out-tsc", "types": ["jasmine"], "typeRoots": ["$REPO/node_modules/@types"] },
  "include": ["$REPO/src/app/Images/**/*.spec.ts", "$REPO/src/app/capture/edit-existing/*.spec.ts", "$REPO/src/app/product/product-edit.spec.ts", "$REPO/src/**/*.d.ts"] }
EOF
    cat >"$WORK/karma.conf.js" <<EOF
module.exports = function (config) {
  const nm = '$REPO/node_modules/';
  config.set({
    basePath: '$REPO',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [require(nm+'karma-jasmine'), require(nm+'karma-chrome-launcher'), require(nm+'@angular-devkit/build-angular/plugins/karma')],
    customLaunchers: { CH: { base: 'ChromeHeadless', flags: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'] } },
    browsers: ['CH'], singleRun: true, reporters: ['progress'], restartOnFileChange: false
  });
};
EOF
    log "Tests: new specs in headless Chrome ($chrome)"
    ( cd "$REPO" && CHROME_BIN="$chrome" NG_CLI_ANALYTICS=false npx --no-install ng test --watch=false \
        --karma-config="$WORK/karma.conf.js" --ts-config="$WORK/tsconfig.images.json" \
        --include='src/app/Images/**/*.spec.ts' --include='src/app/capture/edit-existing/*.spec.ts' \
        --include='src/app/product/product-edit.spec.ts' ) >"$WORK/karma.out" 2>&1 || true
    cat "$WORK/karma.out" >>"$LOG_FILE"
    local line; line="$(tr '\r' '\n' <"$WORK/karma.out" | grep -E 'TOTAL' | tail -1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g')"
    if [[ -z "$line" ]]; then line="$(tr '\r' '\n' <"$WORK/karma.out" | grep -E 'Executed [0-9]+ of [0-9]+' | tail -1 | sed 's/\x1b\[[0-9;]*[A-Za-z]//g')"; fi
    log "  karma: ${line:-no result line found}"
    echo "$line" | grep -q 'FAILED' && die $E_VERIFY "unit tests failed (see $LOG_FILE)"
    echo "$line" | grep -Eq 'SUCCESS|Executed [0-9]+ of [0-9]+ .*SUCCESS' || die $E_VERIFY "could not confirm unit test success (see $LOG_FILE)"
  fi
  log "VERIFY OK."
}

do_self_test() {
  local tmp="$WORK/selftest" fails=0 S BR rc
  mkdir -p "$tmp"
  git clone -q --local "$REPO" "$tmp/repo" || die $E_PREREQ "Could not clone $REPO for the self-test"
  mkdir -p "$tmp/repo/scripts"; cp "$SCRIPT_PATH" "$tmp/repo/scripts/u.sh"
  S="$tmp/repo/scripts/u.sh"; BR="$tmp/bk"
  local R="$tmp/repo"
  run() { bash "$S" --repo "$R" --backup-root "$BR" "$@" >"$tmp/out.txt" 2>&1; rc=$?; cat "$tmp/out.txt" >>"$LOG_FILE"; return $rc; }
  check() { # name, expected rc, args...
    local name="$1" want="$2"; shift 2; rc=0; run "$@" || rc=$?
    if [[ $rc -eq $want ]]; then log "  PASS  $name (exit $rc)"; else log "  FAIL  $name (exit $rc, wanted $want)"; fails=$((fails+1)); fi
  }
  ok() { if eval "$2"; then log "  PASS  $1"; else log "  FAIL  $1"; fails=$((fails+1)); fi; }

  log "Self-test on a disposable clone of HEAD (your working tree is not touched):"
  check "audit reports ready"                 0 --audit
  check "dry-run"                             0 --dry-run
  ok    "dry-run wrote nothing"               '[[ -z "$(git -C "$R" status --porcelain | grep -v "^?? scripts/")" ]]'
  check "apply"                               0 --apply
  check "apply again is a no-op"              0 --apply
  ok    "second apply said already applied"   'grep -q "Already applied" "$tmp/out.txt"'
  check "verify (hashes + tsc if node_modules)" 0 --verify
  # simulate the user's own work after the upgrade
  local conflict_file="src/app/Images/image-utils.ts" f
  echo "# unrelated user note" >>"$R/README.md"; echo "mine" >"$R/src/app/unrelated_user_file.txt"
  cp "$R/$conflict_file" "$tmp/conflict.bak"; printf '\n// user edit\n' >>"$R/$conflict_file"
  check "restore detects the post-upgrade user edit" $E_RESTORE --restore
  ok    "user's edited file was kept"         'grep -q "user edit" "$R/$conflict_file"'
  ok    "unrelated edits preserved"           'grep -q "unrelated user note" "$R/README.md" && [[ -f "$R/src/app/unrelated_user_file.txt" ]]'
  cp "$tmp/conflict.bak" "$R/$conflict_file"
  check "restore completes after conflict resolved" 0 --restore
  local bad=0
  while IFS=$'\t' read -r kind rel; do
    [[ "$kind" == "M" ]] && { git -C "$R" diff --quiet -- "$rel" || bad=$((bad+1)); }
    [[ "$kind" == "N" && -e "$R/$rel" ]] && bad=$((bad+1))
  done <"$FILES"
  ok    "every touched file is back to HEAD; created files removed" '[[ $bad -eq 0 ]]'
  ok    "unrelated edits still preserved"     'grep -q "unrelated user note" "$R/README.md" && [[ -f "$R/src/app/unrelated_user_file.txt" ]]'
  # interrupted-run recovery
  check "re-apply after restore"              0 --apply
  local lastm; lastm="$(ls -1d "$BR"/*_"$UPGRADE_NAME" | sort | tail -1)/manifest.tsv"
  sed -i 's/^#meta\tstatus\tAPPLIED$/#meta\tstatus\tINCOMPLETE/' "$lastm"
  check "restore recovers an INCOMPLETE run"  0 --restore
  if [[ $fails -eq 0 ]]; then log "SELF-TEST PASSED: apply, idempotency, conflict detection, restore and recovery all work."
  else die $E_VERIFY "SELF-TEST FAILED ($fails check(s)); do NOT use --apply. See $LOG_FILE"; fi
}

case "$MODE" in
  self-test) do_self_test ;;
  audit)   do_audit ;;
  dry-run) do_dry_run ;;
  apply)   do_apply ;;
  verify)  do_verify ;;
  restore) do_restore ;;
esac
exit $?

__PAYLOAD_BELOW__
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
