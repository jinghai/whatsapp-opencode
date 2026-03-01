# WhatsApp Bridge Quality + OCR Design

Date: 2026-03-01
Author: Codex
Status: Approved

## Goals

1. Fix all previously identified P0-P2 quality issues.
2. Add image-to-text support with SiliconFlow `deepseek-ai/DeepSeek-OCR`.
3. If OpenCode supports image input, send image directly; otherwise fallback to OCR text.
4. Establish and automate versioning rules:
   - major = architecture generation (manual)
   - minor = feature changes
   - patch = bug fixes
5. Update documentation to match real implementation.

## Scope

### In Scope

- Runtime stability fixes (Docker entrypoint/healthcheck, state serialization safety, daemon startup behavior).
- Coverage gate enforcement and CI truthfulness.
- Packaging cleanup to avoid publishing non-runtime files.
- OCR service integration and capability-based image routing.
- Release automation based on Conventional Commits.
- Documentation refresh.

### Out of Scope

- Re-architecting the sync loop into multiple modules.
- Full end-to-end WhatsApp live tests in CI (still requires manual QR login).

## Key Decisions

### 1) Image capability strategy

Use `OPENCODE_IMAGE_CAPABILITY` with values:

- `auto` (default): try direct image part first, fallback to OCR on unsupported errors.
- `direct`: always send image part directly.
- `ocr`: always OCR first and send text.

This gives deterministic behavior and operational control while still supporting auto fallback.

### 2) OCR integration approach

Create `src/services/ocr.js` to call SiliconFlow chat-completions API with model `deepseek-ai/DeepSeek-OCR`, passing image as data URL.

Output contract:

- returns recognized plain text string
- throws typed error with message suitable for user fallback handling

### 3) State persistence safety

`processingUsers` is runtime-only and must never be serialized to `data/state.json`.

Implement sanitation in save path:

- write only serializable persistent fields (`users` and future persistent keys)
- keep `processingUsers` in-memory `Set` only

### 4) Daemon startup model

PM2 startup must not trigger interactive setup. `src/index.js` will skip setup in daemon mode (`SKIP_SETUP=true`) while keeping setup for direct CLI onboarding paths.

### 5) CI quality gate

Use Jest `coverageThreshold` as the single source of truth and fail PR checks when unmet. PR comments must report actual coverage, not hardcoded claims.

### 6) Versioning automation

Introduce release planning step in CI:

- derive release bump from commits since last tag:
  - contains `feat:` => `minor`
  - else if contains `fix:` => `patch`
  - else no release
- major remains manual trigger only

## File-Level Design

- `src/bridge/sync.js`
  - image flow: direct-vs-ocr routing, fallback logic, user messages/logging
  - state save calls use sanitized persisted state
- `src/services/opencodeClient.js`
  - support image parts in `sendPromptAsync`
- `src/services/ocr.js` (new)
  - DeepSeek OCR request wrapper
- `src/config/index.js`
  - parse/validate `OPENCODE_IMAGE_CAPABILITY`
  - reconcile allowlist behavior with docs (empty allowlist allowed)
- `src/index.js` + `src/daemon/manager.js`
  - non-interactive daemon startup
- `Dockerfile`
  - valid command and health strategy aligned to actual process
- `jest.config.js`
  - coverage thresholds
- `.github/workflows/*.yml`
  - enforce coverage gate, version bump/release orchestration
- `package.json`
  - publish file whitelist and release scripts
- docs and examples
  - README, DEVELOPMENT, WORKFLOW, integration guide, `.env.example`, release notes

## Risks and Mitigations

- Risk: OpenCode direct image schema unknown.
  - Mitigation: keep schema adapter minimal (`{type:'image', image:{path|data_url}}`) and fallback to OCR on any unsupported response in `auto`.
- Risk: OCR API response format variation.
  - Mitigation: parse defensively and normalize text extraction.
- Risk: CI automation releasing unexpectedly.
  - Mitigation: branch/tag filters and no-release when no `feat`/`fix`.

## Testing Strategy

- Unit tests first (TDD):
  - direct image path
  - OCR fallback path
  - forced modes (`direct`, `ocr`)
  - persisted state excludes runtime-only structures
  - daemon start skip-setup path
  - docker/package/workflow behavior assertions where practical
- Full verification:
  - `npm run lint`
  - `npm test`
  - `npm run test:coverage`

## Release Target

Apply new versioning rule and release this delivery as `2.1.0`.
