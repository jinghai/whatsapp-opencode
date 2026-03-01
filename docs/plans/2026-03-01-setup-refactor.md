# Setup Wizard Refactor Plan

> **For Trae:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor `wao setup` to support multi-language, dynamic API key guidance, and stricter post-setup verification.

**Architecture:** 
- **Localization:** Simple i18n object for strings (en/zh).
- **Setup Flow:** Language Selection -> API Key Check -> Config Generation -> Service Start -> Verification -> Auto-Launch `wao start`.

**Tech Stack:** Node.js, Inquirer.js, open (for browser).

---

### Task 1: Update README Feature List

**Files:**
- Modify: `README.md`

**Step 1: Add "No Public IP Required" Feature**
Update the feature list to explicitly mention: "无需公网 IP - 直接通过 WhatsApp 远程控制本地 OpenCode".

### Task 2: Implement Multi-language Support

**Files:**
- Create: `src/utils/i18n.js` (Simple dictionary)
- Modify: `src/setup/index.js`

**Step 1: Create Dictionary**
Define `messages` object with `en` and `zh` keys for all prompts.

**Step 2: Add Language Selection**
At the start of `runSetup`, ask: "Select Language / 选择语言" (Default: English).
Store selection in global or pass down.

### Task 3: Dynamic API Key Guidance

**Files:**
- Modify: `src/setup/index.js`

**Step 1: Modify Config Prompt**
Replace the single API Key input with a flow:
1. "Do you have a SiliconFlow API Key?" (Yes/No)
2. If No: Open browser to invitation link, then ask for key.
3. If Yes: Ask for key directly.

### Task 4: Stricter Verification & Auto-Start

**Files:**
- Modify: `src/setup/index.js`
- Modify: `src/cli/commands/setup.js`

**Step 1: Enhance Verification**
In `src/setup/index.js`, after service start:
- Loop check `checkOpenCodeRunning` with timeout.
- If fails, throw error/exit.
- ONLY print "Setup completed" if service is actually verified running.

**Step 2: Auto-Start `wao`**
In `src/cli/commands/setup.js`:
- Remove the "Do you want to start?" prompt.
- Automatically call `startBridge` (foreground) if setup was successful.
- Print "Starting WhatsApp Bridge..." before launching.

---
