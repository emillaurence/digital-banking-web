---
name: test-banking-component-flows
description: Run the shared Angular UI library through retail banking and wealth portal browser flows.
---

# Banking component runtime testing

## Startup
- From the repository root run `source ~/.nvm/nvm.sh && nvm use`.
- Build `npm run build:lib` before serving apps: the TypeScript alias resolves the library to `dist/ui-components`.
- For simultaneous testing, build once, then run `npx ng serve retail-banking --port 4200` and `npx ng serve wealth-portal --port 4300` in separate sessions.
- Avoid rebuilding the library while serving. ng-packagr clears its output; if a rebuild is necessary, restart both dev servers afterwards.
- Existing listening servers can be reused if they serve the current checkout.

## Devin Secrets Needed
None. Both local demo apps have static data and in-memory actions, not live banking APIs.

## Runtime routes and assertions
- Retail `/` on port 4200: three account cards and five initial transactions. Enter a payee, positive amount, and calendar-selected date before clicking Send payment.
- Cancel in the confirmation dialog preserves fields and rows. Confirm prepends a payment row and clears the form.
- Wealth `/` on port 4300: three portfolio cards and five holdings. Request rebalance exercises the secondary button. Cancel does not add a note; Send request adds a timestamped acknowledgement.
- Reloading resets demo state.
- Verify brand colors using visible screenshots plus read-only computed styles. Card titles inherit dark navy `#1c2540`; headers and button accents use `#012169`.
- Ghost and secondary buttons have transparent base backgrounds, but Material focus/hover state layers can tint them. Move the pointer away and use Tab to shift focus before judging their resting appearance.
- Check console output after each complete flow; Angular development-mode and webpack startup info are expected, errors are not.
