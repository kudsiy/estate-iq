# Estate IQ: project status

Audit date: 3 November 2026. Last updated: 3 November 2026, after the first clean-up and start-up fixes. Current code: branch `audit`.

This repo is still public until the owner finishes task 3, so this file leaves out secret values and step-by-step attack details.

## The short version

**Estate IQ is not close to launch.** The newest code now builds and starts, and that is the first real step. But:

- Chapa is not connected. The checkout is a fake page, and it can hand out paid plans for free.
- Anyone with an account can make themselves an administrator.
- The old database password is gone from the code and from git history, but it may still work until the Railway database is deleted (task 1).

**Next:** the owner finishes tasks 1, 2, and 3. Then Claude continues from task 4b.

## What it is

A website for Ethiopian freelance real estate agents. Agents can:

- keep property listings and browse a supplier feed
- make branded marketing graphics and captions (Brand Studio)
- share tracking links and see who clicked
- manage clients and deals (CRM)
- see simple analytics

It has Amharic and English, and prices in birr.

| Plan | Per month | Per year |
|---|---|---|
| Starter | 499 ETB | 3,493 ETB |
| Pro | 999 ETB | 6,993 ETB |
| Agency | 2,499 ETB | 17,493 ETB |

New accounts get a 14-day free trial.

## How the parts fit together

```
Agent's phone or laptop
  Website: React, Vite, Tailwind
        |
        v
Server: Node, Express, tRPC  ------>  Database: MySQL, Drizzle
  |-- Sign-up codes by SMS  -> Africa's Talking (needs keys)
  |-- Payments              -> NOT connected to Chapa; shows a fake page
  |-- AI text               -> Manus "Forge" (needs a Manus key)
  `-- Telegram posting      -> checks every 60 seconds, but agents have no screen to connect a bot
```

| Part | The truth today |
|---|---|
| Website | Yes. It is built to work on phones. |
| Mobile app | None. There is no Android or iPhone project. |
| Telegram bot | No separate bot. The server has code that posts through Telegram, but no screen lets an agent enter a bot token, so it cannot be used. |
| Graphics | Drawn inside the browser, so they need no paid service. |
| Database | MySQL. The "Master Project Anchor" document says PostgreSQL and Next.js, which is out of date. |
| Hosting | The settings are for Railway only, and the owner says that deployment is over. A new host is needed (see below). |

## All the copies

**The real one is `C:\Users\Hp\OneDrive\Documents\estate-iq-handoff`.** It is the newest and most complete copy, and every commit in it is on GitHub.

**Git history was rewritten on 3 November 2026** to remove old passwords, so every branch has new commit numbers. Older copies and ZIPs still have the old history. Never push from them.

| Copy | Date | Notes |
|---|---|---|
| `estate-iq-handoff` (OneDrive) | 3 Nov 2026 | **Real project.** On branch `audit`, which matches GitHub. |
| GitHub `kudsiy/estate-iq`, branch `audit` | 3 Nov 2026 | Newest code online. The only branch with the start-up fixes. |
| GitHub `kudsiy/estate-iq`, branch `railway-deploy` | 24 Apr 2026 | Passwords removed, but it still does not build or start. |
| GitHub `kudsiy/estate-iq`, branch `main` | 2 Apr 2026 | Passwords removed, but far behind `audit`. It is the branch GitHub shows and downloads by default. |
| `C:\Users\Hp\estate-iq-backups` | 3 Nov 2026 | Backup of all history from before the clean-up. **It still holds the old passwords,** so keep it private and never upload it. |
| `Downloads\estate-iq-main` | 2 Apr 2026 | Download of old `main`. Nothing unique. |
| `Documents\estate-iq-updated\audit-main` | 28 Mar 2026 | Old clone. Nothing unique. |
| `Documents\estate-iq-updated` | 30 Mar 2026 | Older versions of pages, later replaced. |
| `Documents` (loose `client`, `server`, `drizzle` folders) | 27 Mar 2026 | Older. Not compared file by file. |
| `Downloads\Code Projects\estate-iq-updated_1` | 17 Mar 2026 | Older. |
| About 35 ZIP backups, mostly in `Downloads\Sorted Files\Archives` | Mar to Apr 2026 | See below. |

**Is any work missing from GitHub?** Nothing newer than GitHub. Only older experiments are missing:

- `estate-iq-showcase.zip` (27 Mar) has social analytics charts, a notification centre, and a supplier import screen that were never in git.
- The `estate-iq-v1.4` ZIPs (22 Mar) have older Brand Studio tabs and a Telegram helper.
- `estate-iq-sticky-saas.zip` (21 Mar) has alternative dashboard designs.
- The five `estate-iq-complete` ZIPs (25 Mar) could only be listed, not compared. They are older than the first GitHub commit.

Files only in the real folder, and correctly not on GitHub: `.env`, some old logs, and one backup file. The private token note was moved to the Recycle Bin on 3 November 2026.

## How to run it

It builds and starts now, but there is no practice database yet (task 7), so nothing can be saved.

1. Open a terminal in the real project folder.
2. Run `pnpm install`. Ask the owner first if anything new would be installed.
3. **Do not use the existing `.env`.** It points at the real database, and the app changes the database structure when it starts. Use a practice database from task 7.
4. Set `DATABASE_URL`, `JWT_SECRET` (32 or more random characters), and `FRONTEND_URL` (the site's own address).
5. Run `pnpm dev`.

`pnpm start` will not work on Windows because of how it is written, but it works on Linux hosting. `.env.example` lists only 5 of the settings the app reads. Missing from it: `CHAPA_SECRET_KEY`, `BASE_URL`, `FRONTEND_URL`, `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID`, `SENTRY_DSN`, `VITE_SENTRY_DSN`, `OWNER_OPEN_ID`, `SEED_TEST_PASSWORD`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`.

## What the tests showed

All tests ran in a temporary copy with no `.env`, no database, and internet access blocked for the app. No connection to Telegram, Chapa, or the real database was made.

### Latest results (3 November 2026, after the two start-up fixes)

| Check | Result |
|---|---|
| Build website and server (`pnpm build`) | **Passes** |
| Start the built server | **Works.** Health check, home page, website script, and plan list all answer. |
| Start in developer mode | **Works.** The same checks pass. |
| Login page | **Displays with no browser errors** |
| Reading cookies | **Works.** A fake session cookie was read and rejected. |
| Automated tests | 26 of 26 pass, but see the warning below |
| Code check (`pnpm check`) | **3 errors left,** all from one missing type package: `Could not find a declaration file for module 'cors'`. They do not stop the build or the server (task 6b). |

### Found during the audit, not yet fixed

These came from the audit copy. The start-up fixes did not change them.

| Check | Result |
|---|---|
| Home and register pages | Display correctly |
| Pages that need login | Correctly send visitors to the login page |
| Developer login pages in production mode | Correctly blocked |
| `/pricing` and `/billing` | **"Error 404".** The pages exist but are not connected, so every Upgrade and View Pricing button is a dead end. |
| Terms and Privacy pages | **Ask the visitor to log in** before they can be read |
| Sending a sign-up code by SMS | **Fails without keys:** `"username" is required`, and the sign-up form requires a phone code, so nobody can register from the website |
| Site on any address outside `railway.app` | **Blank white page** unless `FRONTEND_URL` is set: `Error: Not allowed by CORS` |
| 12 different people logging in during one minute, through a proxy like Railway's | **Numbers 11 and 12 were blocked:** `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR`. The whole site shares one limit. |
| Login page background photo | Blocked by the site's own security settings |

### Could not be tested

MySQL is not installed on this laptop, and the real database was deliberately left alone. So these are **unverified** and may hide more problems:

- everything after login: CRM, listings, Studio, supplier feed, analytics, admin
- building the database from scratch
- real SMS and AI replies
- Telegram (forbidden)
- Chapa test mode (the connection does not exist yet)

**Warning about the tests:** they give false comfort. `server/monetization.test.ts` tests its own copy of the rules instead of the real code. It even uses a different Pro listing limit (50, while the real plan is unlimited). No test covers sign-up, real payment handling, or admin rights.

## Security check

**Good news**

- `.env` is ignored by git and was never committed.
- 526 stored file versions and all commit messages were scanned. No Chapa keys, Telegram bot tokens, AI keys, or GitHub tokens were found in them.
- Passwords are stored scrambled (bcrypt).
- From the samples read, one customer's data is kept separate from another's. This was read in the code, not tested on a live database.

**The repo is still public** until the owner finishes task 3.

**Clean-up on 3 November 2026:** the old database address and password and the test-account passwords were removed from the code and from all 3 branches on GitHub. A fresh download from GitHub contains none of them. This real folder's stored history no longer contains them either.

### Critical

1. **The old database password may still work.** It was on public GitHub from 23 April to 3 November 2026, so assume strangers copied it. The local `.env` still holds the same address. GitHub can also still show old commits to anyone with their exact address: after the clean-up, the old file still answered on its old address. Only deleting the database or changing its password (task 1) ends this risk. It was not tested against the database.
2. **Anyone with an account can make themselves an administrator.** The sign-up and profile forms let the user choose their own role. An administrator can see every customer's details and change any plan.
3. **Free paid plans.** The fake checkout page runs in production too. Without `CHAPA_SECRET_KEY` the payment receiver accepts any message without proof.
4. **Logged-in users can write files outside the uploads folder**, because uploaded file names are not cleaned. This could lead to a takeover of the server.

### High

5. A script can be injected into the fake checkout page through its web address.
6. The test-account passwords were public until 3 November 2026. The seed scripts now create those accounts only if `SEED_TEST_PASSWORD` is set. If the real database is kept, it must be checked for these accounts, because the old passwords may still work on them.
7. One leftover developer address works without login in production. The social webhook also accepts messages from anyone, which allows fake leads.
8. The login limit is shared by the whole site (tested above). After deployment, a few people can lock out everyone, and the limit on SMS codes works the same way.
9. 147 known problems in add-on packages: 1 critical, 45 high, 88 moderate, 13 low. Most high ones are in `axios`. Updating packages should clear most of them.
10. The browser receives the logged-in user's scrambled password. The admin screen receives everyone's.

### Medium

11. Any site on `railway.app` is trusted by the server's cross-site settings.
12. SVG and HTML uploads are served from the site itself, so they could run scripts.
13. Sign-up has no limit, and requests can be up to 50 MB.
14. Telegram bot tokens are stored unprotected in the database and sent to the browser.
15. SMS codes use a weak random number generator and are lost when the server restarts.
16. The session key in the local `.env` is short, and the server will start without one. Check the production value.
17. The GitHub token from the private note still works until the owner cancels it (task 2). The note is in the Recycle Bin, and `.gitignore` now blocks files like it. A forced add could still get past that rule, and no automatic secret check exists yet (task 4b).
18. The whole project, including `.env`, syncs to OneDrive.

## What stands between this app and paying users

### Payments

- **Chapa is not connected.** `server/_core/chapa.ts` is a stand-in and never contacts Chapa.
- The payment receiver expects details Chapa's documentation does not promise to send, such as the plan name. It does not confirm the payment with Chapa, check the amount, or ignore repeats. There is no payment history.
- Chapa's documentation says to re-check each payment with its verify service before giving access.
- **Quick route:** the app has a manual Telebirr, CBE and WhatsApp screen, but it is one of the unconnected pages. Connecting it could allow manual payments before Chapa is ready. The owner would activate each customer from the admin page.
- The owner must confirm the phone number, bank account, and company name on that screen are correct.
- Chapa needs a business licence, a TIN, and identity checks, according to a 2022 report. The same report gives a 3.5% local fee. Confirm both with Chapa.

### User accounts

- The website cannot register anyone until an SMS provider is set up.
- Phone login sends a paid SMS on every login. It should be only for sign-up and password reset.
- Africa's Talking was not confirmed as usable or payable from Ethiopia. Ethiopian options to check are AfroMessage and HahuCloud SMS. One guide gives 0.50 to 1 ETB per local SMS, which is unconfirmed.
- Email addresses are not verified. People who signed up by email cannot reset a password.
- Deleting an account leaves the workspace and customer data behind.

### Features that pretend

- Instagram posting reports "published" without posting. TikTok does the same when not connected. Facebook does not exist.
- Telegram posting has no screen to connect it.
- Every tracking link points to `app.estateiq.et`, and that address does not exist on the internet. Shared links are dead today.
- The lead API shown in Settings is not connected. Lead form pages are not connected either.
- The home page shows invented numbers (such as "124 leads today" and "62M+ closed value"), says agents across Addis use it, and has a "Beta Access: April 2026" countdown stuck at zero. These should go before real customers see them.
- The billing screen shows invented usage numbers.
- Server AI features need a Manus key and fail without one. Free replacement: Google lists Ethiopia as a supported country for the Gemini API. Check the free limits in Google AI Studio.
- Supplier feed listings are typed in by hand. There is no Telegram or Facebook collection.
- Eight built pages are not connected to the menu: Billing, Pricing, Social Media, Lead Capture, Matching, Deal Pipeline, Contacts, and one Brand Kit version.

### Hosting

- Uploaded photos are saved on the server's disk and vanish on every redeploy.
- A new database will not get its tables automatically. Start-up only adds 15 columns.
- The website is heavy for mobile data: a 977 KB main script and a 360 KB start page, partly from leftovers of the Manus builder.
- There are no backups and no alerts unless they are set up on the host.

### Can it be hosted free, or paid from Ethiopia?

Yes for testing. For paying customers, plan on about 1,400 ETB a month. Prices were checked on 3 November 2026, and they change.

| Option | Cost | Good | Problem |
|---|---|---|---|
| **EthioDeploy Free** | 0 | Deploys from GitHub, Node supported, database add-on listed | 256 MB memory (may be too small), sleeps after 30 minutes idle |
| **EthioDeploy Pro** (recommended for launch) | 1,399 ETB/month | Always on, 1 GB, 5 GB database, own domain, **pays by Telebirr** | Server location not stated. Young company. Confirm the MySQL add-on works. |
| **Render + TiDB Cloud + Cloudinary** | 0 | Good for a demo. TiDB is MySQL-compatible with 5 GB free. Cloudinary needs no card. | Render sleeps after 15 minutes and takes about a minute to wake. Posting stops while asleep. Confirm TiDB needs no card. |
| **HahuCloud server** | 3,174/month for 1 GB (the page shows no currency; probably ETB) | Full control. Bank payment logos shown. | You maintain it yourself. Its listed server locations are outside Ethiopia. |
| **Railway** (ended by the owner) | One $5 trial credit | Settings are already in the code | Needs a foreign payment method to continue, very likely. |

**Recommendation:** test on a free option, then move to EthioDeploy Pro when the first customers pay. Three Starter customers would cover it. Add photo storage on Cloudinary's free plan.

### Legal (ask a lawyer; this is not legal advice)

Ethiopia's Personal Data Protection Proclamation 1321/2024 matters here, because the app stores names and phone numbers:

- Article 22(1) says personal data collected locally must be stored on a server in Ethiopia. **This could rule out foreign hosting.** Ask about it before choosing a final host.
- Article 33(1) requires registration with the Ethiopian Communications Authority.
- There are duties around consent, data access and deletion requests, and reporting breaches within 72 hours.
- A November 2025 report said key directives were still pending. The status today was not confirmed.

Sources: [Chapa webhooks](https://developer.chapa.co/integrations/webhooks), [Chapa verify](https://developer.chapa.co/integrations/verify-payments), [Chapa test mode](https://developer.chapa.co/integrations/test-mode-vs-live-mode), [Chapa onboarding report](https://shega.co/news/chapa-officially-launches-payment-gateway-service), [EthioDeploy pricing](https://ethiodeploy.com/pricing), [EthioDeploy Node guide](https://ethiodeploy.com/deploy/nodejs), [HahuCloud VPS](https://www.hahucloud.com/vps), [HahuCloud SMS](https://hahucloud.com/sms), [Render free plan](https://render.com/docs/free), [Railway pricing FAQ](https://docs.railway.com/reference/pricing/faqs), [TiDB Cloud pricing](https://www.pingcap.com/tidb-cloud-pricing/), [Cloudinary pricing](https://cloudinary.com/pricing), [Gemini regions](https://aistudio.google.com/docs/available-regions), [AfroMessage report](https://shega.co/news/afromessage-new-platform-to-empower-businesses-with-sms-communications-enters-ethiopian-market), [SMS price guide](https://sent.dm/resources/ethiopia-sms-pricing), [Proclamation text](https://www.metaappz.com/References/ethiopian_laws/federal/pr_1321_2024/en/txt), [legal summary](https://mehrteableul.com/legal-update-on-the-ethiopian-personal-data-protection-proclamation-no-1321-2024/), [enforcement report](https://shega.co/news/one-year-on-ethiopia-s-personal-data-protection-law-faces-a-slow-path-to-enforcement).

## Fix list

Do these in order. Each is sized for one session. Tick each box when done, then commit and push. **[OWNER]** means the owner must do or approve it, because Claude cannot log in to the accounts.

### Stage 1: stop the leaks (do these first)

- [ ] **1. [OWNER]** Delete the Railway database, since the owner says the deployment is over. This is permanent. If its data is still wanted, change the password instead. Claude cannot do this.
- [ ] **2. [OWNER]** Cancel the old GitHub tokens on GitHub, then empty the Recycle Bin. The note itself is already out of the project folder.
- [ ] **3. [OWNER]** Make this repo private, as the owner has decided. Claude could not do this because the app's browser is not signed in to GitHub.
- [x] **4.** Remove the old database password and test-account passwords from the code and from git history. Done 3 November 2026: backup made and restored as a test, 62 commits compared with 0 problems, force-pushed, and a fresh download checked.
- [ ] **4b.** Add a check that blocks secrets from being committed.

### Stage 2: make it run

- [x] **5.** Fix the login page mistake (`LoginPage.tsx`, line 321). Done 3 November 2026: `pnpm build` passes.
- [x] **6.** Add `cookie-parser` and its types. Done 3 November 2026: the server starts in both modes.
- [ ] **6b. [OWNER approves install]** Add `@types/cors`, a development-only package, and clear the last 3 errors. Done when `pnpm check` passes.
- [ ] **7. [OWNER approves install]** Set up a practice MySQL database on the laptop, separate from the Ollaa PostgreSQL server. Run all 11 database updates from empty. Complete `.env.example`. Done when a test user can sign up by email and log in.
- [ ] **8.** Click through every page after login, and add newly found bugs to this list.

### Stage 3: close the security holes

- [ ] **9.** Stop users from choosing their own role. Only `OWNER_OPEN_ID` makes an administrator. Add a test.
- [ ] **10.** Clean uploads: safe file names, images only, no SVG, a size limit. Add a test.
- [ ] **11.** Remove the fake checkout and developer addresses from production. Protect the social webhook with a secret.
- [ ] **12.** Stop sending scrambled passwords and bot tokens to the browser.
- [ ] **13.** Fix the login limit behind a proxy. Limit sign-ups and request sizes. Trust only the app's own address. Refuse to start without a strong `JWT_SECRET`.
- [ ] **14.** Update the add-on packages, then re-run all tests.
- [ ] **15.** Delete test account creation from start-up, including the seed step in `nixpacks.toml`. The scripts now skip it unless `SEED_TEST_PASSWORD` is set. **[OWNER approves]** If the real database is kept, check it for test accounts and remove them.

### Stage 4: take money safely

- [ ] **16.** Connect `/billing` and `/pricing`, with real usage numbers. **[OWNER]** Confirm the payment details on screen. Manual Telebirr payment then works, with activation from admin.
- [ ] **17. [OWNER provides test keys]** Connect real Chapa checkout in test mode and store each payment attempt.
- [ ] **18.** Handle Chapa's message properly: check the signature, confirm with Chapa's verify service, check amount and currency, and ignore repeats. Add tests with fake messages.
- [ ] **19. [OWNER]** Apply for a Chapa business account. Then the owner, not Claude, makes one small real payment to confirm it works.

### Stage 5: accounts

- [ ] **20.** Compare Ethiopian SMS providers and connect the one the owner chooses. Send codes only for sign-up and password reset. Keep codes safe across restarts. Standardise phone number formats.
- [ ] **21.** Add email verification and password reset, using a free email service.
- [ ] **22.** Make account deletion remove the customer's data, and add a data export.

### Stage 6: make the features honest

- [ ] **23.** Use the site's real address for tracking links instead of `app.estateiq.et`.
- [ ] **24.** Store uploads on Cloudinary's free plan.
- [ ] **25.** Replace Manus AI with the Gemini free tier, with a clear message when limits run out. Remove Manus leftovers and shrink the website.
- [ ] **26.** Stop false "published" messages. Add a screen to connect Telegram, tested only with fake Telegram calls. Make Terms and Privacy public. Remove invented numbers from the home page. Replace the fake tests with real ones.

### Stage 7: launch

- [ ] **27. [OWNER]** Get legal advice on data storage and registration. Choose the host, then set it up with a database, backups, and error alerts. Move the newest code to `main`, and move the project out of OneDrive.
- [ ] **28. [OWNER]** Run a small pilot with 3 to 5 trusted agents before opening to the public.
