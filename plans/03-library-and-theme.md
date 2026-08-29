# 03 — Library scaffold, Angular Material, custom design-system theme

## Goal

`libs/ui-components` exists as a buildable ng-packagr library named `@bofa/ui-components`, Angular Material 14 is installed, and a custom Material theme (custom palettes, typography, component overrides — the **BofA Design System**) is written in the library and applied to both apps.

## Prerequisites

- Plan 02 done (both apps build and test green). Node 16.20.2 active.

## Steps

All commands from the repo root.

1. **Generate the library under `libs/`.** The v14 library schematic has no reliable project-root flag, so flip `newProjectRoot` temporarily. In `angular.json` change `"newProjectRoot": "apps"` → `"newProjectRoot": "libs"`, then:

   ```bash
   npx ng generate library ui-components --prefix bofa
   ```

   Then change `newProjectRoot` **back to** `"apps"`. Expected result: `libs/ui-components/` with `src/public-api.ts`, `ng-package.json`, `package.json`, and a `ui-components` project in `angular.json`. The schematic also adds `ng-packagr` to devDependencies.

   The schematic also writes `libs/ui-components/karma.conf.js` with the same `clearContext: false` default as the app configs. Apply the same change as plan 02 step 2 — set `clearContext: true` (and replace the stale trailing comment) — or phase 4's library test suite reintroduces the spurious `Some of your tests did a full page reload!` ERROR lines.

2. **Pin ng-packagr and install Material:**

   ```bash
   npm install --save-exact --save-dev ng-packagr@14.2.2
   npm install --save-exact @angular/material@14.2.7 @angular/cdk@14.2.7
   ```

   (Material is installed manually rather than via `ng add` so no interactive theme prompts run — the theme is hand-written below.)

3. **Name the package.** Replace the entire contents of `libs/ui-components/package.json` with:

   ```json
   {
     "name": "@bofa/ui-components",
     "version": "0.0.1",
     "peerDependencies": {
       "@angular/common": "^14.2.0",
       "@angular/core": "^14.2.0",
       "@angular/forms": "^14.2.0",
       "@angular/cdk": "^14.2.0",
       "@angular/material": "^14.2.0",
       "rxjs": "^7.5.0"
     },
     "dependencies": {
       "tslib": "^2.3.0"
     }
   }
   ```

4. **Fix the import path mapping.** In the root `tsconfig.json`, replace whatever the schematic wrote under `compilerOptions.paths` with exactly:

   ```json
   "paths": {
     "@bofa/ui-components": ["dist/ui-components"]
   }
   ```

   This maps imports to the **built** library — realistic for an enterprise setup, and it means: **always `npx ng build ui-components` before building/testing an app.**

5. **Remove the placeholder code** the schematic generated:

   ```bash
   rm libs/ui-components/src/lib/ui-components.component.ts \
      libs/ui-components/src/lib/ui-components.component.spec.ts \
      libs/ui-components/src/lib/ui-components.service.ts \
      libs/ui-components/src/lib/ui-components.service.spec.ts
   ```

   Replace `libs/ui-components/src/lib/ui-components.module.ts` with (real components arrive in plan 04):

   ```ts
   import { NgModule } from '@angular/core';
   import { CommonModule } from '@angular/common';

   @NgModule({
     imports: [CommonModule],
   })
   export class UiComponentsModule {}
   ```

   Replace `libs/ui-components/src/public-api.ts` with:

   ```ts
   export * from './lib/ui-components.module';
   ```

6. **Write the design-system theme.** Create three files.

   Brand palette: Bank of America's brand colours — **navy** (anchor ≈ `#012169`) as **primary** and **red** (anchor ≈ `#E31837`) as **accent**. Red is BofA's signature colour but is too aggressive as a primary for form fields, buttons and table headers across an entire banking UI; navy primary with red accents reads correctly. Both palettes carry the full hue set **including `A100`/`A200`/`A400`/`A700`** — `mat.all-component-themes` themes every Material component, and several (slider, slide-toggle, progress bar) read A-hues from the accent palette; missing keys surface as a null-colour Sass error.

   `libs/ui-components/src/styles/_palettes.scss`:

   ```scss
   @use '@angular/material' as mat;

   // BofA Design System palettes — built around the brand anchors
   // (navy #012169, red #E31837), not stock Material colors.
   $bofa-navy: (
     50: #e1e4ed,
     100: #b3bcd2,
     200: #8090b4,
     300: #4d6496,
     400: #274280,
     500: #012169,
     600: #011d61,
     700: #011856,
     800: #01144c,
     900: #000b3b,
     A100: #6f79ff,
     A200: #3c4aff,
     A400: #091bff,
     A700: #0012ee,
     contrast: (
       50: rgba(black, 0.87),
       100: rgba(black, 0.87),
       200: rgba(black, 0.87),
       300: white,
       400: white,
       500: white,
       600: white,
       700: white,
       800: white,
       900: white,
       A100: rgba(black, 0.87),
       A200: white,
       A400: white,
       A700: white,
     ),
   );

   $bofa-red: (
     50: #fce3e7,
     100: #f7bac3,
     200: #f18c9b,
     300: #eb5d73,
     400: #e73b55,
     500: #e31837,
     600: #e01531,
     700: #dc112a,
     800: #d80e23,
     900: #d00816,
     A100: #ffd7da,
     A200: #ffa4ab,
     A400: #ff717c,
     A700: #ff5865,
     contrast: (
       50: rgba(black, 0.87),
       100: rgba(black, 0.87),
       200: rgba(black, 0.87),
       300: rgba(black, 0.87),
       400: white,
       500: white,
       600: white,
       700: white,
       800: white,
       900: white,
       A100: rgba(black, 0.87),
       A200: rgba(black, 0.87),
       A400: white,
       A700: white,
     ),
   );

   $bofa-primary: mat.define-palette($bofa-navy, 500, 200, 800);
   $bofa-accent: mat.define-palette($bofa-red, 500, 200, 800);
   $bofa-warn: mat.define-palette(mat.$red-palette, 700);
   ```

   `libs/ui-components/src/styles/_typography.scss`:

   ```scss
   @use '@angular/material' as mat;

   // v14 uses the legacy typography level names (headline/title/body-1/...).
   $bofa-typography: mat.define-typography-config(
     $font-family: '"Public Sans", "Helvetica Neue", Arial, sans-serif',
     $headline: mat.define-typography-level(28px, 36px, 700),
     $title: mat.define-typography-level(20px, 28px, 600),
     $subheading-2: mat.define-typography-level(16px, 24px, 600),
     $body-1: mat.define-typography-level(15px, 24px, 400),
     $button: mat.define-typography-level(15px, 16px, 600),
   );
   ```

   `libs/ui-components/src/styles/_theme.scss`:

   ```scss
   @use '@angular/material' as mat;
   @use 'palettes';
   @use 'typography';

   // Design-system restyling of Material internals. These target v14 (pre-MDC,
   // "legacy") class names and must live in global styles, not component styles.
   @mixin overrides() {
     .mat-button-base.bofa-button {
       border-radius: 9999px;
       padding: 0 22px;
       min-width: 96px;
     }

     .mat-card.bofa-card {
       border-radius: 12px;
       border: 1px solid #e2e7f0;
       box-shadow: 0 2px 10px rgba(1, 33, 105, 0.07) !important;
     }

     table.mat-table.bofa-table {
       width: 100%;

       th.mat-header-cell {
         color: #012169;
         font-weight: 600;
         font-size: 13px;
         text-transform: uppercase;
         letter-spacing: 0.04em;
         border-bottom: 2px solid #012169;
       }

       tr.mat-row:hover {
         background: #f2f5fb;
       }
     }

     .mat-form-field-appearance-outline .mat-form-field-outline {
       color: #aab6cf;
     }

     .mat-dialog-container {
       border-radius: 16px;
       padding: 28px;
       box-shadow: 0 12px 40px rgba(1, 33, 105, 0.25);
     }

     .mat-calendar-body-selected {
       box-shadow: 0 0 0 2px #f18c9b;
     }
   }

   // Single entry point every app includes exactly once.
   @mixin bofa-theme() {
     @include mat.core(typography.$bofa-typography);

     $theme: mat.define-light-theme((
       color: (
         primary: palettes.$bofa-primary,
         accent: palettes.$bofa-accent,
         warn: palettes.$bofa-warn,
       ),
     ));

     @include mat.all-component-themes($theme);
     @include overrides();
   }
   ```

7. **Apply the theme in both apps.** The theme is consumed from library **source** (Sass has no dist step here), so no build ordering applies to styles.

   Replace the contents of `apps/retail-banking/src/styles.scss` **and** `apps/wealth-portal/src/styles.scss` with:

   ```scss
   @use '../../../libs/ui-components/src/styles/theme' as bofa;

   @include bofa.bofa-theme();

   html,
   body {
     height: 100%;
     margin: 0;
   }

   body {
     font-family: 'Public Sans', 'Helvetica Neue', Arial, sans-serif;
     background: #f4f6fa;
     color: #1c2540;
   }
   ```

   In **both** apps' `src/index.html`, add inside `<head>`:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com" />
   <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
   ```

8. **Commit:**

   ```bash
   git add -A
   git commit -m "Add ui-components library with custom Material theme"
   ```

## Verification

```bash
npx ng build ui-components     # ng-packagr succeeds → dist/ui-components with fesm2020/, package.json name @bofa/ui-components
npx ng build retail-banking    # succeeds; styles.css in dist is large (~70KB+) because the Material theme compiled in
npx ng build wealth-portal     # succeeds
cat dist/ui-components/package.json | grep '"name"'   # "@bofa/ui-components"
```

Optional visual check: `npx ng serve retail-banking` — the placeholder page now renders in Public Sans on a light-grey background.

## Done when

`ng build ui-components` and both app builds exit 0, `dist/ui-components/package.json` has name `@bofa/ui-components`, and both apps' compiled CSS contains the Material theme (verify: `grep -l "mat-button" dist/retail-banking/styles.*.css` matches).

## Risks

- **Sass errors in the theme** are the likeliest failure. Two candidates: (a) `mat.core($config)` — on v14 this accepts a typography config (possibly with a deprecation warning; warnings are fine). If it hard-errors, change to `@include mat.core();` followed by `@include mat.legacy-typography-hierarchy(typography.$bofa-typography);` — and if that mixin name doesn't exist on 14, plain `@include mat.core();` and accept default type scale for Material internals. (b) legacy typography level names — if `$subheading-2` is rejected, delete that line; only `$font-family` is essential. A third historical candidate — a null-colour error from a component theme reading a missing `A100`/`A200`/`A400`/`A700` hue — is designed out: both palettes define the full A-hue set with contrast entries (step 6). If such an error appears anyway, check the palette maps for a typoed or missing key before touching anything else.
- **`ng generate library` behaves differently than expected** (e.g. writes a `paths` entry pointing somewhere odd, or lands outside `libs/`). Steps 1 and 4 overwrite both the location mechanism and the paths block, so drift in schematic output is absorbed; just confirm the folder is `libs/ui-components` before continuing.
- **Forgetting to flip `newProjectRoot` back to `apps`.** Nothing breaks until a later `ng generate application`, but check it now — the verification greps in plan 01 apply.
- **`@use 'palettes'` fails to resolve.** Sass resolves `_palettes.scss` as a partial relative to the importing file; all three files sit in the same folder, so this should work. If not, use the explicit `@use './palettes'` form.
