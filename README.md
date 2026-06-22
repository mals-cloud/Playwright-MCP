# Playwright MCP — Agentic AI Test Automation

An agentic test automation project where **Claude Code**, connected to the browser through the **Model Context Protocol (MCP)** inside **VS Code**, autonomously explores a target web application and generates, runs, and fixes its own **Playwright (TypeScript)** test suite from a high-level natural-language prompt — no test cases hand-written by an engineer.

## How it works

Rather than writing locators and assertions by hand, this project gives Claude Code a goal in plain English (e.g. *"test all locator strategies on this site"* or *"automate the checkboxes, drag-and-drop, dropdown, and hovers pages"*). Claude Code then:

1. Lists and reads the existing project structure (`playwright.config.ts`, `package.json`, `tests/`) to understand conventions already in place.
2. Uses web-fetch tooling (via MCP) to inspect the live pages of the target site and understand their DOM structure.
3. Selects the most appropriate Playwright locator strategy for each element (`getByRole`, `getByText`, `getByLabel`, `getByPlaceholder`, `getByAltText`, CSS, XPath, etc.) and explains the choice in code comments.
4. Generates one spec file per page/feature under `tests/locators/`, organised in `describe()` blocks with `expect()` assertions and a console summary at the end of each file.
5. Runs the suite, reads the failures, and fixes its own bugs (e.g. correcting an inverted assertion in the drag-and-drop spec after a real test failure) — without manual debugging from the engineer.

## Target application

**[https://the-internet.herokuapp.com/](https://the-internet.herokuapp.com/)** — Elemental Selenium's practice site, used here as a sandbox covering the full range of tricky UI automation cases: checkboxes, dropdowns, dynamic content, iframes/frames, drag-and-drop, hovers, alerts, file upload/download, tables, and more.

## Tech Stack

| Layer | Tool |
|---|---|
| AI Agent | Claude Code |
| Agent-to-tool protocol | Model Context Protocol (MCP) |
| IDE | VS Code |
| Test framework | Playwright (TypeScript) |
| Language config | `tsconfig.json` (Node + Playwright types) |

## Project Structure

```
Playwright MCP/
├── .github/                  # CI workflow config
├── node_modules/
├── playwright-report/        # HTML report output
├── test-results/
│   └── screenshots/          # Auto-captured screenshots on test failure
├── tests/
│   └── locators/
│       ├── checkboxes.spec.ts
│       ├── drag-and-drop.spec.ts
│       ├── dropdown.spec.ts
│       └── hovers.spec.ts
├── playwright.config.ts      # baseURL: https://the-internet.herokuapp.com
├── tsconfig.json
├── package.json
└── package-lock.json
```

## Locator Strategies Covered

| Page | Strategy | Why |
|---|---|---|
| Checkboxes | `getByRole('checkbox')` + `.nth()` | No `id`/`label` on the inputs — role is the only stable semantic hook |
| Drag and Drop | `locator('css')` (`#column-a`, `#column-b`) | Stable IDs on the draggable columns; tested with both `dragTo()` and a `mouse.move/down/up` fallback |
| Dropdown | `getByRole('combobox')` + `locator('#dropdown')` | `<select>` has an implicit ARIA role; CSS used for `:checked` / `[disabled]` option-level assertions |
| Hovers | `locator('.figure')` + `getByAltText('User Avatar')` + `getByRole('link')` | No IDs on the profile cards — `.figure` is the only structural hook; alt text and link role used for the image and "View profile" link |

The wider locator-strategy exploration prompt also exercised `getByText`, `getByLabel`, `getByPlaceholder`, `getByTitle`, and `locator('xpath')` across additional pages (dynamic controls, dynamic loading, form authentication, frames/iframes).

## Setup

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run everything
npx playwright test

# Run a specific spec
npx playwright test tests/locators/checkboxes.spec.ts

# Run all four locator specs on Chromium with a readable list reporter
npx playwright test tests/locators/checkboxes.spec.ts tests/locators/drag-and-drop.spec.ts tests/locators/dropdown.spec.ts tests/locators/hovers.spec.ts --project=chromium --reporter=list
```

Each spec file prints its own console summary at the end of the run (total tests, passed, failed, locator strategy used). Screenshots are automatically captured to `test-results/screenshots/` on any test failure.

## Results (latest run)

| Feature | Total | ✅ Passed | ❌ Failed |
|---|---|---|---|
| Checkboxes | 9 | 9 | 0 |
| Drag and Drop | 8 | 8 | 0 |
| Dropdown | 13 | 13 | 0 |
| Hovers | 18 | 18 | 0 |
| **Total** | **48** | **48** | **0** |

## Notable Agentic Fix

During the drag-and-drop run, Claude Code's own test caught a logic bug it had written: dragging column **B onto A** from the initial `[A, B]` order still produces `[B, A]`, because the underlying jQuery UI sortable widget always places the dragged element at its drop position rather than performing a true swap. Claude Code corrected the assertion, re-ran the spec, and confirmed all 8 drag-and-drop tests passed.

## Author

**Malathi Subburathinam**
Senior SDET | QA Automation Engineer
[GitHub](https://github.com/mals-cloud) · [LinkedIn](https://linkedin.com/in/malathi-subburathinam)
