# Changes

## 4.0.0 2026-11-21

First entry of this change log. Earlier versions are on npm and in the git
history.

- Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/tillo-provider@3`.
- The entity peer is `@seneca/entity` `^29.0.0` instead of `seneca-entity`.
  The other peers are `@seneca/provider` `^5.0.0` and `@seneca/env` `^0.6.0`,
  which is now optional: the plugin itself does not use it.
- The `seneca-promisify` peer dependency is removed. Seneca 4 has promises
  built in; do not call `use('promisify')` (D4).
- The package no longer ships `dist/tsconfig.tsbuildinfo`.
- Tests load plugins by full name (`@seneca/entity`, `@seneca/provider`) and
  load the `@seneca/entity` types for `seneca.entity()` (T5). Without
  credentials, `list-float`, `list-brand` and `issue-gc` now run against a
  local mock of the Tillo API, which checks the request signature, instead
  of being skipped; with `test/local-config.js` or the environment
  variables `TILLO_API_KEY` and `TILLO_SECRET` they call the Tillo sandbox.
  Live calls were not tested on Seneca 4.
- devDependencies: `seneca` `^4.0.0`, `@seneca/entity` `^29.0.0`,
  `@seneca/provider` `^5.0.0` and `seneca-msg-test` `^5.0.0`;
  `seneca-entity`, `seneca-promisify`, `@seneca/env`, `@seneca/maintain`
  and `@seneca/doc` (with the disabled `doc` script), which the tests do not
  use, are removed.
- README: Seneca 4 install line, plugins loaded by full name.
- `repository.url` uses `git+https`, `publishConfig` sets public access, and
  the package includes `CHANGES.md`.
