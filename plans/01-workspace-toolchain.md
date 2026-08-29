# 01 — Workspace and toolchain

## Goal

An empty Angular 14.2 CLI workspace exists in this repo, on Node 16.20.2, with exact dependency versions pinned and `newProjectRoot` set to `apps`.

## Prerequisites

- Repo root is `/Users/emilpastor/Documents/github/digital-banking-web` (currently contains only `LICENSE`, `plans/`, `.git`).
- nvm installed; Google Chrome installed (needed from phase 2 onward).
- No phase depends on this one having run before — this is phase 1.

## Steps

1. **Select Node 16** (Angular 14 does not support Node 18+):

   ```bash
   nvm install 16.20.2
   nvm use 16.20.2
   node -v   # v16.20.2
   npm -v    # 8.19.4
   ```

2. **Record the Node version** so future sessions pick it up with plain `nvm use`. Create `.nvmrc` at the repo root containing exactly:

   ```
   16.20.2
   ```

3. **Generate the workspace into the current directory** (no application yet — apps come in phase 2). From the repo root:

   ```bash
   npx --yes @angular/cli@14.2.13 new digital-banking-web --directory . --create-application false --package-manager npm --skip-git
   ```

   This writes `angular.json`, `package.json`, `tsconfig.json`, `.gitignore`, `README.md`, `.vscode/`, and runs `npm install`. It must not touch `LICENSE`, `plans/`, or `.git`.

4. **Point new projects at `apps/`.** In `angular.json`, change:

   ```json
   "newProjectRoot": "projects"
   ```

   to:

   ```json
   "newProjectRoot": "apps"
   ```

5. **Pin exact versions.** `ng new` writes caret/tilde ranges; replace them with exact versions (karma/jasmine lines stay as generated — they don't affect the migration story):

   ```bash
   npm install --save-exact \
     @angular/animations@14.2.12 @angular/common@14.2.12 @angular/compiler@14.2.12 \
     @angular/core@14.2.12 @angular/forms@14.2.12 @angular/platform-browser@14.2.12 \
     @angular/platform-browser-dynamic@14.2.12 @angular/router@14.2.12 \
     rxjs@7.5.7 zone.js@0.11.8 tslib@2.4.1

   npm install --save-exact --save-dev \
     @angular-devkit/build-angular@14.2.13 @angular/cli@14.2.13 \
     @angular/compiler-cli@14.2.12 typescript@4.7.4
   ```

6. **Commit** (plain message, no trailers):

   ```bash
   git add -A
   git commit -m "Scaffold Angular 14.2 workspace on Node 16"
   ```

## Verification

```bash
node -v          # v16.20.2
npx ng version   # Angular CLI: 14.2.13, Node: 16.20.2, Package manager: npm 8.19.4
grep newProjectRoot angular.json          # "newProjectRoot": "apps"
grep '"@angular/core"' package.json       # "@angular/core": "14.2.12"  (no ^ or ~)
```

## Done when

`npx ng version` reports Angular CLI 14.2.13 on Node 16.20.2, `angular.json` has `"newProjectRoot": "apps"`, and `package.json` lists the exact versions from step 5 with no range prefixes on `@angular/*`, `typescript`, `rxjs`, `zone.js`, `tslib`.

## Risks

- **`ng new --directory .` refuses because the folder is non-empty.** No generated filename collides with the existing `LICENSE`/`plans/`, so this should pass. If it errors anyway: run the same command without `--directory .` in an empty temp folder, then move everything except `.git` from `digital-banking-web/` into the repo root.
- **Wrong Node active** (e.g. a shell that didn't run `nvm use`). Symptom: `npm install` fails compiling something or `ng` prints an unsupported-Node warning. Fix: `nvm use 16.20.2` and retry; the install is safe to re-run.
- **Deprecation / `EBADENGINE` warnings during install.** Expected for 2022-era packages; ignore anything that is a `WARN`. Only `npm ERR!` is a failure.
- **A globally installed modern `ng` shadowing the local one.** All commands use `npx`, which prefers the workspace-local CLI once installed; don't run bare `ng` from outside the repo.
