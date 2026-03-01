# WhatsApp OpenCode Bridge v2.1.0 Release Notes

## Highlights

### 1. Image OCR fallback with DeepSeek OCR

- Added SiliconFlow `deepseek-ai/DeepSeek-OCR` integration for image-to-text.
- New config `OPENCODE_IMAGE_CAPABILITY`:
  - `auto` (default): direct image -> fallback OCR if unsupported
  - `direct`: always send image to OpenCode
  - `ocr`: always OCR first, then send text to OpenCode

### 2. Runtime stability fixes

- Fixed Docker runtime entrypoint (`src/index.js`) and invalid HTTP healthcheck.
- Daemon startup now sets `SKIP_SETUP=true`, avoiding interactive setup in PM2 mode.
- State persistence now excludes runtime-only `processingUsers`, preventing serialization bugs.

### 3. CI/CD and release governance

- Enforced Jest coverage thresholds (global gates).
- Removed hardcoded PR coverage claim and rely on real test/coverage gate results.
- Added auto version bump workflow:
  - `feat:` => `minor`
  - `fix:` => `patch`
  - `major` kept as manual trigger

### 4. Packaging and docs cleanup

- Removed tracked coverage artifacts from repository.
- Added npm `files` whitelist to publish only runtime-relevant files.
- Updated README and all workflow/development/integration docs to match real behavior.

## Verification Snapshot

- `npm run lint` passed
- `npm test` passed
- `npm run test:coverage` passed
- Coverage (global):
  - statements: `80.11%`
  - lines: `82.87%`
  - functions: `81.6%`
  - branches: `62.81%`
