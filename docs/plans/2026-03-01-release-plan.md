# WhatsApp OpenCode 2.0 Release Plan

> **For Trae:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finalize the major release of WhatsApp OpenCode with CLI support, SiliconFlow integration, and updated documentation.

**Architecture:** 
- CLI tool (`wao`) for management.
- Integration with SiliconFlow API.
- Comprehensive documentation and testing.

**Tech Stack:** Node.js, Commander.js, PM2, Jest.

---

### Task 1: Integrate SiliconFlow Invitation Link

**Files:**
- Modify: `README.md`
- Modify: `src/setup.js` (or correct path)

**Step 1: Update README.md**
Add the invitation link `https://cloud.siliconflow.cn/i/ouQu1EpG` to the configuration section.

**Step 2: Update Setup Wizard**
Modify the prompt for `OPENCODE_API_KEY` or `SILICONFLOW_API_KEY` to include the registration link.

### Task 2: Final Integration Test

**Files:**
- Test: `tests/integration.test.js` (if exists) or manual verification via `npm test`.

**Step 1: Run Full Test Suite**
Run `npm test` to ensure all 41 tests pass.

### Task 3: Documentation Update

**Files:**
- Modify: `README.md` (CLI commands, installation)
- Create: `docs/CLI.md` (Detailed CLI usage)

**Step 1: Update README.md**
Ensure all CLI commands (`wao setup`, `start`, `stop`, `status`, `logs`, `config`) are documented.

**Step 2: Create docs/CLI.md**
Provide detailed examples for each command.

### Task 4: Version Bump and Release Notes

**Files:**
- Modify: `package.json`
- Create: `RELEASE_NOTES.md`

**Step 1: Bump Version**
Update version to `2.0.0` (Major release).

**Step 2: Create Release Notes**
Draft `RELEASE_NOTES.md` highlighting:
- New CLI tool (`wao`).
- Multi-user session support.
- Permission confirmation interactive flow.
- SiliconFlow integration.

### Task 5: Pre-release Check

**Files:**
- Check: `package.json` (bin entry)

**Step 1: Verify Bin Entry**
Ensure `"bin": { "wao": "./bin/wao.js" }` is correct.

