# Paper audit brief — Checks & Sample calibration

**Your job: audit, then report. Do not change the Paper file until Lara has read your findings and told you what to fix.**

---

## 1. What exists and why

Two developer POCs (synthetic sample grading, and rubric checks) were rebuilt as one Studio prototype at
`prototypes/checks/index.html` — a single test-editor surface with two tabs, **Sample calibration** and **Checks**.

Those designs were then rebuilt **in Paper** so they can be worked on outside code.

- **Paper file:** `Traverse Studio / Tests` — id `01M0GNS0S2BNKF8RDH3K473G2K`
- **Page:** `Checks and Calibration` — id `p-2-0`
- Open it with `get_basic_info` (omit `fileId` only if Lara already has it open; otherwise pass the id above).

The Paper page is laid out in three bands, each with a full-width dark banner artboard:

| Band | Artboards |
|---|---|
| **▬ SHARED FOUNDATIONS** | `Foundations — severity language & primitives` |
| **▬ SPACE A · SAMPLE CALIBRATION** | `A · Calibration — component variants` (12 blocks) · `Calibration 01 — Starting view` · `Calibration 05 — Results, Sample view` |
| **▬ SPACE B · QUALITY CHECKS** | `B · Quality checks — component variants` (9 blocks) · `Checks 01 — Not checked` |

Convention: component sheet on the left, full screens to its right, on the same row.

---

## 2. The audit

Check that **everything drawn in Paper matches the real `tv-*` components in this repo**. Specifically:

- **Status tags / chips** — padding, radius, gap, icon size, type, tone colours, border
- **Buttons** — heights, padding, radius, gap, icon size, type, every variant and disabled state
- **Tabs** — colours, weights, underline, spacing
- **All text** — size, weight, line-height, letter-spacing, colour against the `--text-*` role tokens
- **Anything else** that has a real `tv-*` equivalent

### Source of truth — read these, don't trust this brief's summaries

```
component-library/registry.json                    ← canonical inventory, read FIRST
component-library/components/tv-status-tag.js      ← chips (the big one)
component-library/components/tv-button.js          ← buttons
component-library/components/tv-tab.js             ← tabs
component-library/components/tv-tab-group.js       ← tab strip
component-library/components/tv-modal-card.js      ← modal header/footer grammar
component-library/tv-components.js                 ← THE TYPE ROLES (.tv-tag, .tv-button, .tv-label …)
design-system/colors_and_type.css                  ← every token, incl. the --text-* role scale
design-system/traverse-design-system.md            ← written spec (§7 components, §5 typography)
```

The type roles in `tv-components.js` are the thing most likely to have been missed — components hold **no type
literals**, they apply a role class (`.tv-tag`, `.tv-button`, `.tv-label-strong`) that reads `--text-*` tokens.
Paper was built with raw px values, so every one needs checking against its role.

Quick role reference (**verify against the file, don't take this as gospel**):

| Role | Weight / size / leading / tracking |
|---|---|
| `.tv-tag` | 600 / 11px / 1 / 0.01em |
| `.tv-button` | 600 / 14px | 
| `.tv-button-sm` | 600 / 12px |
| `.tv-label` | 500 / 14px / 1.2 |
| `.tv-label-strong` | 600 / 14px / 1.2 |
| `.tv-h6` · `.tv-h5` · `.tv-h3` | 600 / 14px · 16px · 20px |
| `.tv-body` · `.tv-body-sm` | 400 / 14px / 1.55 · 400 / 12px / 1.5 |
| `.tv-caption` | 500 / 12px / 1.4 / `--fg-3` |
| `.tv-eyebrow` | 600 / 11px / 0.05em / uppercase / `--fg-3` |
| `.tv-stat` | 700 / 30px / 1.1 / −0.01em |

---

## 3. Deviations I already suspect — verify these first

These were spotted while writing this brief but **not** confirmed across every instance. Treat as leads, not findings.

1. **Tabs use the wrong active colour and weight.** `tv-tab` active is `--primary-600` with `.tv-label-strong`
   (600). The Paper tabs look like `--primary-700` at weight 500. Check every tab in both full-screen artboards.
2. **Tab underline.** `tv-tab` draws it as `::after`, 2px, `--primary-600`, `border-radius: 2px 2px 0 0`, at
   `bottom:-1px`. Paper uses a plain `border-bottom` with no radius.
3. **Tab padding.** Component is `10px 2px 14px` with `gap:8px`. Paper is roughly `8px 0 12px` with `gap:7px`.
4. **Status tag border.** `tv-status-tag` renders `border: 0.5px solid <tone border>`. Most Paper chips have
   **no border at all**; a few (`.ck-code`-style chips) use a 1px rgba border instead. Decide with Lara whether
   Paper should match the component or the written §7.3 spec (tint + solid fg, no border) — they disagree.
5. **Status tag letter-spacing.** `.tv-tag` sets `0.01em`. Most Paper chips omit it.
6. **Button icon size.** `tv-button` uses `.ic { font-size: 15px }` for **both** md and sm. Some Paper sm buttons
   use 14px.
7. **Chip radius.** Component is `var(--radius-sm)` = **6px**. The component's inline fallback says `8px`, which is
   misleading — the token wins. Check Paper chips are 6px, not 8px.

Do not stop at this list. It is a starting point, not the scope.

---

## 4. Deliberate deviations — confirm, don't "fix"

These were conscious calls. Note them in your report as decisions, and say if you disagree, but don't treat them
as defects:

- **Paper token names differ.** Paper uses `--color-surface-500`; the repo uses `--surface-500`. Same values,
  different namespace — Paper's token system requires the `--color-*` prefix. Not a bug.
- **Tone borders use `rgb(... / 0.28)`** derived from the tone's own colour, because Paper does not support
  `color-mix()` and the component's own border colours (`#bbf7d0`, `#fde68a`, `#bae6fd`, `#fecaca`) are raw hex
  with no token. Flag if you find a better answer.
- **Unstable / mixed / contested is `--info-500` (sky), not indigo.** Indigo is actions only and must never carry
  a severity. This is a standing decision.
- **Orange is gone.** Out of date / draft / improvement / attention are all `--warn-600`. Also standing.
- **Icons are inline Lucide SVG paths** at 2px stroke rather than the `icon-*` font, because Paper renders SVG
  natively. Check the *names* match what the components use; stroke weight is a known difference worth raising.
- **Rich text is unsupported in Paper** — any bold or coloured word mid-sentence is a separate text node. If you
  see a sentence split oddly, that is why.

---

## 5. Known token gap

The Paper file's token set was extended during the rebuild to carry the severity language:
`--color-success-600`, `--color-warn-600`, `--color-info-500`, the `-100` tints, `--color-surface-600/800`,
`--radius-xs`, `--radius-xl`, `--font-mono`. Each has a description explaining its role.

It is still a **subset** of `colors_and_type.css`. If you find Paper hard-coding a value that should be a token,
say so — adding tokens is cheap and in scope for a follow-up.

---

## 6. How to work

1. `get_guide({ topic: "paper-mcp-instructions" })` **before any other Paper tool**. Mandatory.
2. `get_basic_info` → `get_tree_summary` on each artboard to map it.
3. Use **`get_computed_styles`** for exact values — never read sizes or colours off a screenshot. Screenshots are
   for spotting things worth measuring, not for measuring.
4. Read the component source for each thing you check. Quote the file and line in your report.
5. You are **read-only on Paper** for this pass. No `write_html`, `update_styles`, `set_text_content`,
   `create_tokens` or `set_tokens` until Lara says go. If you do end up editing later, `finish_working_on_nodes`
   when done.

---

## 7. What to hand back

A single report, grouped **by component** (not by artboard), each finding with:

- **Component** — e.g. `tv-status-tag`
- **Where** — artboard + layer name, and how many instances are affected
- **Expected** — the component/token value, with `file:line`
- **Found** — the value in Paper, from `get_computed_styles`
- **Severity** — *wrong* (contradicts the component) / *drift* (inconsistent between Paper instances) /
  *deliberate* (§4 above)
- **Fix** — one line on what the change would be

End with a short list ordered by what you'd fix first, and call out anything where the component and the written
design-system doc disagree — those need Lara's decision, not a patch.

---

## 8. Context you may want

- `.context/checks-poc-consistency-audit.md` — the original audit of the two POCs (this workspace only; ask Lara
  if you need it copied over)
- `UI Change Logs/Checks.md` — every decision made during the HTML rebuild, dated
- `UI Change Logs/Component Library.md` — the `tv-status-tag` / `tv-modal-card` / `tv-tab-group` changes made
  during this work, including the upgrade-race bug in `tv-tab-group`
- `V2-to-V1-bridge/shared-modal-card-rulebook.md` — when/how the modal card is used
- `CLAUDE.md` — repo rules. "Tokens, not values" and "reuse components, never rebuild them" are the two that
  matter here.
