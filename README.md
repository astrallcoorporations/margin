# Margin

Personal Class 8 study workspace — English SA1.

- `app/` — the web app (Vite + React). Run `npm install` then `npm run dev` inside it, or double-click `Open Margin.bat`.
- `english/` — the study files the app reads (notes, worksheets, texts).
- `vercel.json` — deploy settings; import this repo into Vercel and it builds `app/` with the files included.

See [app/README.md](app/README.md) for details.

## Vex (AI and Google Classroom)

Margin can send its prompts to **Vex**, your own AI server (the `nova` folder next to this one), and read Google Classroom through it.

- Easiest: double-click `Open Margin.bat`. It starts Vex and Margin together.
- Or run `node server.js` in the `nova` folder, then Margin as usual.
- Margin looks for Vex at `http://localhost:3000`. Change it with `VITE_VEX_URL` in `app/.env` (see `app/.env.example`).
- The sidebar has **Sign up / Sign in**. Until you sign in with Google, the AI and Classroom are locked. Only ked.edu.in school accounts and a short approved list can sign in.
- Once signed in: **Ask Vex** buttons on Ask AI, task review, tests, topic pages, flashcards and Revise; and a **Classroom** page with what is due and the class stream.
- Prompts longer than about 24,000 characters are refused for Vex (Groq's free plan is small). Use Copy for those.

Setup of the Google keys is in the Vex README.

### Classroom subjects

Every Google Classroom course appears as a subject tab (and in the sidebar) by itself, with its topics, posts and downloaded files. You do not edit Margin when a teacher posts something new: press **Sync now** on the subject page, or wait for the automatic sync. The curated English study set (`english/`, `src/data/english/`) stays exactly as it was.
