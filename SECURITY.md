# Security

Site Log holds personal data of construction crews (names, hours, photos,
signatures) and a firm's customers. If you find a weakness, please tell us
before telling anyone else.

**Contact:** a.bizior@pm.me — subject line "Site Log security". You will get
a reply within 3 working days and a fix or a plan within 14 days for
anything that exposes data.

**In scope:** the web app at https://abizior-coder.github.io/Site-manager/,
the Firestore rules in this repository, the Cloudflare Worker
(`site-log-claude-proxy`), the service worker, the import and backup paths.

**Out of scope:** denial of service, social engineering, anything that
needs a compromised device or account, findings in Firebase, Cloudflare or
GitHub themselves.

**Please do not:** access or alter data that is not yours, run automated
scanners against the production project, or publish details before a fix.

There is no bounty programme; credit in the changelog is offered.

What has been audited so far: two security audit rounds (September 2026)
covered the rules model, single-use invites, company caps in the Worker and
the import guard; the engineering audit covers the rest. Summaries are kept
locally by the owner and shared with customers on request.
