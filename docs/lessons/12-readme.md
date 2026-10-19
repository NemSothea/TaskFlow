# Lesson 12: README

## Goal
Document the project well enough that a new developer can run it in 5 minutes and understand the security model without reading the code.

## Concepts
A good README answers, in this order:
1. What the project is
2. How to run it
3. How to configure it
4. How to use the API
5. Why it is built this way
6. How to check it
7. How to deploy it

The environment-variable table lists the default and the purpose of every variable, and never a real value.

## Files touched
- `README.md`

## Walkthrough
- **Setup:** copy-pasteable commands, including how to generate a secret key.
- **Environment variables:** every variable read in `backend/config/settings.py` appears in the table.
- **API:** one row per endpoint, including the CSRF requirement for refresh and logout.
- **Security design:** the reasoning from lessons 03 and 04 in five bullets.
- **Production notes:** the settings to flip, `check --deploy`, a shared cache for throttling, and `flushexpiredtokens`.

## Run it
```bash
git checkout lesson-12
```
Follow the README from a fresh clone, on another machine if you can.

## Check yourself
Every command in the README works exactly as written. Note anything you had to guess; that's a documentation bug.

## Exercise
Add a "Troubleshooting" section covering the three problems you hit while setting up (for example, port 5432 in use, or Docker not running).
