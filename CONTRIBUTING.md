# Contributing

Thanks for helping. Everything runs on Node 18+ with no dependencies; FFmpeg and Playwright are needed for the media tests.

## Workflow

1. Change the sources:
   - criteria, thresholds, profiles: `plugins/umd/referential/*.json` (French and English for every text);
   - licence traps: `plugins/umd/referential/licenses.json` (cite the licence file or model card in `note`);
   - references: `plugins/umd/references/**` following [tools/REFERENCE_GUIDE.md](tools/REFERENCE_GUIDE.md) (English, 60–140 lines, verified facts only);
   - CLI: `plugins/umd/scripts/`.
2. `node tools/build.mjs` validates the referential and regenerates `docs/` and the versions (from `VERSION`).
3. `node --test tests/` must pass, and `node tools/site.mjs` must build the documentation site (`_site/`, not committed; GitHub Actions publishes it).
4. New automatic criterion: add its check in `scripts/lib/autocheck.mjs` (the build fails otherwise) and a test.

## Principles

- A criterion must be checkable with evidence a reviewer can see: a file and line, a command and its output, a frame at a given time.
- Thresholds that are conventions, not standards, are labelled as such and stay overridable per project.
- Every token Claude reads has a cost: prefer a compact JSON summary over raw output, one image over many, a reference read on demand over always-loaded text.
- Never recommend a non-commercial, Tencent (EU), AGPL or unlicensed component without a ⚠️ and its consequence.
