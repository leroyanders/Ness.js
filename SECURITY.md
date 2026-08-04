# Reporting Security Issues

If you believe you have found a security vulnerability in Ness.js, let us know right away. We investigate every legitimate report and do our best to fix the problem quickly.

**Report it privately, not as a public issue:** [open a draft advisory](https://github.com/leroyanders/Ness.js/security/advisories/new). Only the maintainers can see it, so the vulnerability is not disclosed while a fix is being prepared.

Include the affected package and version, what an attacker can do with the flaw, and the smallest set of steps that reproduces it.

There is no bug bounty programme. The following are out of scope, because they are not vulnerabilities in Ness.js itself:

- Findings in a dependency. Report those to the dependency, then tell us so we can bump it.
- Missing hardening headers in `ness dev` or `ness preview`. The development and preview servers are not production servers; see [`@nessframework/security`](https://nessjs.com/docs/plugins/security) for what production sets.
- Anything that needs an attacker to already have write access to the project's source or its `ness.config.mjs`.
