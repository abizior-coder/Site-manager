# Deploy only when CI is green

**Status: implemented 2026-09-05** (accepted the same day; value plan 1.4; found the hard way on
2026-09-04 when commit 56f3ff3 shipped with a logic suite that did not
even parse — CI red, Pages deployed anyway).

## Goal

A push to `main` deploys only after the CI workflow has passed for that
exact commit. A manual deploy stays possible.

## Design

- `.github/workflows/pages.yml`: trigger on `workflow_run` of "CI"
  (completed, branch main) plus `workflow_dispatch`; the job runs only when
  the CI conclusion is `success` (or on manual dispatch); checkout uses the
  CI run's `head_sha` so the deployed tree is the tested one.
- The bundle-matches-source check stays as a second guard.
- PROJECT.md: the build-and-deploy paragraph says so.

## Definition of done

- A red CI on main produces no Pages deploy; a green one does; the
  deployed build meta matches the commit CI tested.

## Out of scope

- Branch protection / required reviews (owner's GitHub settings).
