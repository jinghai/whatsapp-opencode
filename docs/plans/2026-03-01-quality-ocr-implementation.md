# Quality + OCR + Release Automation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all P0-P2 quality issues, add DeepSeek OCR image support with capability fallback, and ship automated version/release flow with updated docs.

**Architecture:** Keep existing module layout, add a dedicated OCR service, extend sync image handling with capability strategy, and tighten delivery pipeline (coverage gates, packaging, release logic). Persist only durable state fields and keep runtime-only processing state in memory.

**Tech Stack:** Node.js 18+, Jest, ESLint, GitHub Actions, npm publish, PM2, Axios.

---

### Task 1: Add failing tests for quality defects and OCR routing

**Files:**
- Modify: `tests/sync.test.js`
- Modify: `tests/bridge.test.js`
- Modify: `tests/cli.test.js`
- Create: `tests/services.test.js`

**Step 1: Write failing tests**
- Add tests for:
  - `processingUsers` never persisted to JSON state
  - image handling:
    - direct mode sends image part to OpenCode
    - ocr mode sends OCR text
    - auto mode falls back to OCR on direct unsupported errors
  - empty allowlist accepted by config loader
  - daemon path sets `SKIP_SETUP=true` (or equivalent non-interactive bootstrap)

**Step 2: Run tests and verify failures**
- Run: `npm test -- tests/sync.test.js tests/bridge.test.js tests/services.test.js tests/cli.test.js`
- Expected: newly added tests fail for missing behavior.

**Step 3: Commit (tests only)**
- Run:
  - `git add tests/sync.test.js tests/bridge.test.js tests/services.test.js tests/cli.test.js`
  - `git commit -m "test: add failing coverage for quality and OCR routing"`

### Task 2: Implement OCR service and image capability routing

**Files:**
- Create: `src/services/ocr.js`
- Modify: `src/services/opencodeClient.js`
- Modify: `src/bridge/sync.js`
- Modify: `src/config/index.js`

**Step 1: Implement minimal code**
- Add OCR client wrapper with model `deepseek-ai/DeepSeek-OCR`.
- Add image capability parsing (`auto|direct|ocr`) and defaulting.
- Route image input according to capability.
- In auto mode, fallback to OCR when direct image request is unsupported.

**Step 2: Run targeted tests**
- Run: `npm test -- tests/sync.test.js tests/services.test.js tests/bridge.test.js`
- Expected: new and existing tests pass.

**Step 3: Commit**
- Run:
  - `git add src/services/ocr.js src/services/opencodeClient.js src/bridge/sync.js src/config/index.js tests/sync.test.js tests/services.test.js tests/bridge.test.js`
  - `git commit -m "feat: add deepseek OCR fallback for whatsapp images"`

### Task 3: Fix runtime and delivery P0-P2 issues

**Files:**
- Modify: `Dockerfile`
- Modify: `src/index.js`
- Modify: `src/daemon/manager.js`
- Modify: `jest.config.js`
- Modify: `package.json`
- Modify: `.gitignore`
- Delete: `coverage/**` tracked reports (repo cleanup)

**Step 1: Implement minimal code**
- Fix Docker command and health strategy to align with executable process.
- Ensure daemon startup is non-interactive.
- Add coverage thresholds and make gate enforceable.
- Restrict published files to runtime assets.
- Remove committed coverage artifacts from repository.

**Step 2: Run tests and lint**
- Run:
  - `npm run lint`
  - `npm test`
  - `npm run test:coverage`
- Expected: pass with enforced threshold.

**Step 3: Commit**
- Run:
  - `git add Dockerfile src/index.js src/daemon/manager.js jest.config.js package.json .gitignore coverage`
  - `git commit -m "fix: harden runtime and delivery quality gates"`

### Task 4: Rework CI/CD and versioning automation

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/pr-check.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `scripts/release.sh`

**Step 1: Implement**
- Remove hardcoded coverage claims and report actual values.
- Ensure PR/build fails when threshold unmet.
- Add automated bump derivation (`feat`=>minor, `fix`=>patch) and manual major override path.
- Keep release/publish steps deterministic and tag-based.

**Step 2: Validate workflow syntax**
- Run: `npm test -- tests/cli.test.js` (sanity) and quick yaml inspection via `rg`.

**Step 3: Commit**
- Run:
  - `git add .github/workflows/ci.yml .github/workflows/pr-check.yml .github/workflows/release.yml scripts/release.sh`
  - `git commit -m "ci: automate release bump rules and truthful quality checks"`

### Task 5: Update docs to match implementation

**Files:**
- Modify: `README.md`
- Modify: `docs/DEVELOPMENT.md`
- Modify: `docs/WORKFLOW.md`
- Modify: `docs/INTEGRATION_TEST_GUIDE.md`
- Modify: `.env.example`
- Modify: `RELEASE_NOTES.md`
- Include: `CLAUDE.md` in commit as requested

**Step 1: Update docs**
- Reflect:
  - OCR + capability modes
  - allowlist behavior
  - versioning rule and release workflow
  - Docker and daemon usage reality

**Step 2: Validate docs consistency**
- Run: `rg -n "ALLOWLIST|coverage|2.0.0|2.1.0|OCR|OPENCODE_IMAGE_CAPABILITY" README.md docs .env.example RELEASE_NOTES.md`

**Step 3: Commit**
- Run:
  - `git add README.md docs/DEVELOPMENT.md docs/WORKFLOW.md docs/INTEGRATION_TEST_GUIDE.md .env.example RELEASE_NOTES.md CLAUDE.md`
  - `git commit -m "docs: align documentation with OCR and release automation"`

### Task 6: Final verification and release

**Files:**
- Modify: `package.json` version to `2.1.0` (if not already)

**Step 1: Full verification**
- Run:
  - `npm run lint`
  - `npm test`
  - `npm run test:coverage`

**Step 2: Branch integration**
- Create feature branch `codex/quality-ocr-release-2-1`.
- Merge back into `main` after verification.

**Step 3: Push, tag, release, npm publish**
- Run:
  - `git push origin main`
  - `git tag v2.1.0`
  - `git push origin v2.1.0`
  - `gh release create v2.1.0 --generate-notes`
  - `npm publish`

**Step 4: If blocked by network/auth**
- Capture exact failing command/output and provide one-shot recovery commands.
