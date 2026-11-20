# gilbertanderson.com: Retrospective Handoff

Updated 2026-11-19 · Gilbert Anderson

## Status in one line
Everything is merged and live at https://gilbertanderson.com through PR #73 (master `2c9c66e`): phone nav, browser-following theme, Stormers Play it menu, and Docker/Kubernetes and CI/CD experience. No PRs are open. Next step: review the Dependabot alerts and delete the stale remote branches.

## Where everything is
| Item | Location |
|---|---|
| Code | `C:\Users\gilbert\dev\gilbertanderson.github.io`, branch `master`, remote `gilbertanderson/gilbertanderson.github.io` |
| Site content (single source) | `backend/content/site.toml`, validated by `backend/app/schemas.py` |
| Generated files | `frontend/src/content.json`, `frontend/openapi.json`, `frontend/src/client/siteApi.ts` (built by `npm run build`; needs `backend/.venv/Scripts` on PATH) |
| Resume (the master copy) | `frontend/public/Gilbert_Anderson_Resume.docx` and `.pdf` |
| Live site | https://gilbertanderson.com (GitHub Pages, deploys on push to master; DNS on Cloudflare, DNS only) |
| Last merged PR | https://github.com/gilbertanderson/gilbertanderson.github.io/pull/73 |
| Design canvas | https://claude.ai/artifact/494kSuHZZBiMrvEY5pwJKW |
| Retrospective skill | `C:\Users\gilbert\.claude\skills\retrospective\SKILL.md` (packaged copy `C:\Users\gilbert\dev\retrospective.skill` is the older version) |
| Tailored Scrum resume | a new file beside the original `TH_Technical_Scrum_Master...docx`, never the site resume |

## Retrospective: what happened, in order
Earlier parts of this session were summarized, so the early phases are from the summary and git, not the full conversation.

1. **Content sync and polish (#34 to #50).** Stormers became the sixth project; logos for every role; LinkedIn sync; Wabtec and EA roles; testing tools by role; OpenShift and RHEL. Several of these went out as stacked PRs.
2. **Resume repair (#47).** An earlier regex edit had corrupted the live .docx so Word wouldn't open it. Rebuilt from the last good version, added a PDF, and added `test_resume_files.py`.
3. **Resume download and skills (#52 to #62).** PDF/Word chooser, bold fix, Varsity Tutors Scrum classes, subtitle "UI/UX & AI/Automation Lead", ATS wording. Pinia, OAuth/SAML/YAML, Redux/RTK Query, NgRx and Vue/Selenium/Cypress came in one request at a time and stacked up to six PRs deep (#57 to #62); most were closed and folded into one.
4. **Role details (#63 to #70).** Scrum Master and Take2/Booz Allen roles, Chainguard and Go, Okta SSO and OAuth 2.0, SAML, Plarium DevOps and cost cut, GE Cloud Foundry, general IT and cybersecurity summary. Again stacked (#65 to #69), then merged as one.
5. **LinkedIn posts section (#71).** "From LinkedIn" above the contact band with the Towers & Titans post. LinkedIn profile edits were done in the built-in browser pane.
6. **Retrospective skill.** Created `/retrospective`, then rewritten to match the earlier handoff docs once Gilbert said he'd described a similar one before.
7. **Nav, theme, Stormers (#72).** Phone nav on its own scrolling row, theme follows the browser with a dark fallback and no flash, Stormers "Play it" menu with 3D and 2D. Docker/Kubernetes from 2016 at GE Digital was added to the same PR.
8. **Docker, Kubernetes, CI/CD (#73).** Wabtec bullet, Docker on every EC2 role, Bitbucket Pipelines and GitLab CI. This commit was pushed after #72 had already merged, so it missed master and needed its own PR. Merged on Gilbert's OK and deployed; the live bundle has all four new lines.
9. **Retrospective.** This file, plus memory updates for PR state checks and gh quoting on Windows.

## Retrospective: how it went
**What went well**
- One content file drives the site, the API spec and the generated client, so most requests were a `site.toml` edit plus a rebuild.
- After the corruption incident, every resume edit used run-only XML edits, a `minidom` parse, a Word COM open with a page count (4), and a PDF re-export. No resume broke again.
- Changes were checked in the browser preview at phone width (computed weights, scroll widths, link targets), not just by tests.
- The live site was checked after deploy by fetching the HTML and bundle, which is how the missing #73 content was caught.

**What went poorly**
- **Corrupted resume:** the regex `<w:t[^>]*>` also matched `<w:top>`. Impact: the live resume didn't open in Word. Root cause: a too-loose pattern and no check that the file still opened. Caught by Gilbert. Fix: the strict `<w:t(?:\s[^>]*)?>` pattern, a pytest check, and the Word COM open on every edit.
- **Stacked PRs:** quick one-line requests each got their own PR, stacked up to six deep. Impact: Gilbert couldn't see changes live and approved merges over and over; superseded PRs had to be closed. Root cause: treating every message as a new branch. Caught by the pattern itself. Fix: fold follow-ups into the open PR (now in memory).
- **Commit pushed to a merged PR:** the #72 merge happened before the last push to its branch, so the Wabtec/EC2/CI/CD commit was stranded. Root cause: not checking the PR state before pushing a follow-up. Caught by checking the live bundle after deploy. Fix: cherry-picked into #73.
- **Scrum resume layout changes:** I changed formatting when only content was asked for. Caught by Gilbert ("Don't change format of scrum resume"). Fix: content-only edits.
- **Merge approvals:** a merge without an explicit OK was blocked by the safety check, and so was merging #73 under the "Yes" given for #72. Each PR needs its own OK.
- **Windows tooling friction:** `gh pr create --body` broke on quotes in PowerShell; `gh ... -q` with spaces failed; the vitest 5 upgrade broke workers; Word's `ExportAsFixedFormat` hung.

**Do differently next time**
1. Before pushing to a PR branch, run `gh pr view <n> --json state` and open a new branch if it's merged.
2. One open PR at a time; add new small requests to it and update the description.
3. Use `--body-file` for PR bodies on Windows.
4. For any tailored resume, change words only, never layout, unless asked.

## What was verified, and what was not
- Verified: frontend 12/12 and backend 12/12 tests pass; the #73 deploy run succeeded.
- Verified: live bundle after #73 contains "Started working with Docker", "deployed to AWS EC2", "containerized test environments" and "Bitbucket Pipelines".
- Verified: resume .docx opens in Word at 4 pages with the new lines; the PDF was re-exported from it.
- Verified: live site has the theme script, the Play it menu and the 2D link (fetched HTML and JS bundle after the #72 deploy succeeded).
- Verified: phone nav scrolls on its own row at 375 to 390px in the preview; the theme is dark with nothing saved.
- Not verified: on a real phone, or in Safari. Check by opening the site on an iPhone.
- Not verified: how the new bullets look on the rendered live page (only the bundle text was checked). Open Experience and Skills to eyeball them.
- Not verified: the live resume download opens in Word (the local file did, at 4 pages).
- Not verified: the LinkedIn profile matches the latest site wording (Docker, Kubernetes, CI/CD were not added to LinkedIn).

## Lessons worth keeping
- **The site resume is the master.** Edit it in place with run-only XML edits and a Word open check; tailored copies are new files with layout untouched.
- **Check PR state before pushing.** A merged PR silently ignores later pushes to its branch.
- **Verify the live site after deploy.** Fetching the page and bundle catches what didn't ship.
- **Merges need an explicit OK per PR.** "Do it" or a yes to a different PR isn't one.

## What is left
1. Dependabot reports 5 vulnerabilities on master (2 critical); review and update.
2. Delete stale remote branches: `caci-okta-oauth`, `caci-saml`, `cybersecurity-wording`, `ge-cloud-foundry`, `it-support-summary`, `linkedin-posts`, `nav-theme-stormers`, `plarium-cost-portal`, `plarium-devops`. Leave `stable_build` alone until Gilbert says what it is.
3. LinkedIn: fill the two free skill slots (suggested Cloud Foundry, Okta, Redis), consider adding Docker/Kubernetes/CI/CD wording, and refresh the headline and About.
4. Project screenshots for the cards.
5. Re-package `retrospective.skill` from the updated `SKILL.md` if Gilbert wants to share it.
6. Decide whether to commit this RETROSPECTIVE.md to the repo (it's untracked).

## Prompt to start the next chat
~~~text
I'm working on my portfolio site, gilbertanderson.com, in C:\Users\gilbert\dev\gilbertanderson.github.io. Read RETROSPECTIVE.md first.
Content lives in backend/content/site.toml and the resume is frontend/public/Gilbert_Anderson_Resume.docx (it's the master, edit in place, check it opens in Word at 4 pages, re-export the PDF).
Everything through PR #73 is merged and live. Next, look at the Dependabot alerts and clean up the stale remote branches listed in the handoff.
Keep one PR open at a time and only merge when I say so. No Claude co-author or "Generated with" lines, and never paste passwords or secrets.
~~~
