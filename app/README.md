# Margin

A personal Class 8 study workspace. Curriculum → resource → learn → practise → copy for LLM review → review weak areas.

No account, no server. Progress is saved in your browser (Settings → Download backup to move it).

## Run it

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173.

`npm run build && npm run preview` also works — the preview server serves your study files too.

## Where things live

| What | Where |
| --- | --- |
| Your study files | `../english/` — read in place, never copied |
| Curriculum + file manifest | `src/data/english/resources.ts` |
| Practice tasks | `src/data/english/tasks.ts` |
| Flashcards | `src/data/english/flashcards.ts` |
| Subjects registry | `src/data/catalog.ts` |
| LLM prompt wording | `src/lib/prompts.ts` |

### Add a file

Drop it into the right folder under `english/`, then add it to that resource's `files` list in `resources.ts`. Files missing from disk show “Local file unavailable” instead of a broken button; Settings lists any that are missing.

### Add a subject

Create `src/data/<subject>/` with the same shape as `src/data/english/`, add its folder to `ROOTS` in `vite.config.ts`, and register it in `src/data/catalog.ts`.

## Shortcuts

`Ctrl/⌘ K` or `/` search · `G` then `H/L/P/F/R` jump · `?` all shortcuts · flashcards: `Space` flip, `←/→`, `1` need review, `2` know, `S` shuffle, `R` restart · task editor: `Ctrl ↵` copy for LLM.
