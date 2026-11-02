# Estate IQ: rules for Claude

Read `STATUS.md` first. It says what works, what is broken, and which task is next.

## How to work with the owner

- The owner is not a programmer. Explain everything in simple words.
- Do the technical work yourself. Stop only for something you physically cannot do, such as logging in to the owner's accounts.
- Never show a password, key, or token in the chat, in a commit, or in any file. This includes test passwords. Hide values when reading files that may hold them.
- Say plainly what was tested and what was not. Never call something done without running it.

## Safety rules (always on, until the owner changes them)

1. **Telegram:** never log in, post, or send any message, from any tool. Automated tests must use fake (mocked) Telegram calls.
2. **Chapa:** never make a real payment or call Chapa's live system. Use test mode with test keys, or read the code. Only the owner makes a real payment.
3. **Ollaa:** never touch the `ollaa` database or any Ollaa project. Other sessions work on them. The PostgreSQL server on this laptop belongs to them, so Estate IQ must not use it.
4. **Money:** the owner is in Ethiopia and cannot pay for foreign subscriptions or paid API tiers. Choose only free tiers or services payable from Ethiopia. Check current terms before recommending one.
5. **Installing:** ask the owner before installing anything, including packages for this project.
6. **Production database:** the local `.env` points at the real database, and the app changes the database structure automatically when it starts. Do not start the app, run migrations, or run seed scripts with that file. Use a separate practice database.
7. **Destructive actions:** ask before force-pushing, rewriting git history, deleting data, or changing whether the repo is public or private.

## Git rules

- **Commit and push after every finished task.**
- Stage files by name. Never use `git add .` or `git add -A`, because private files sit in this folder.
- Before each commit, check that the list of staged files contains only what you meant to commit.
- Before each push, scan the changes for passwords, keys, and tokens.
- Never put secrets in code, including one-off scripts. Read them from environment variables.
- Work on the `audit` branch until the owner chooses another. It contains all the newest code. `main` is 51 commits behind, so do not base work on it.
- After each task, update the "Fix list" and "What works" parts of `STATUS.md` in the same commit.

## Where things are

- **Real project folder:** `C:\Users\Hp\OneDrive\Documents\estate-iq-handoff`
- **GitHub:** `kudsiy/estate-iq`
- `C:\Users\Hp\Downloads\estate-iq-main` is an old download of `main`. Do not work there. The other copies are listed in `STATUS.md`.
- **Built with:** React and Vite (website), Node, Express and tRPC (server), MySQL with Drizzle (database). The file `# Estate IQ — Master Project Anchor.md` says Next.js and PostgreSQL, which is out of date.

## Commands (run from the real project folder)

- `pnpm test` runs the automated tests. They use no database and no internet.
- `pnpm check` checks the code for errors.
- `pnpm build` builds the website and server.
- `pnpm dev` starts the app. Read safety rule 6 first.
