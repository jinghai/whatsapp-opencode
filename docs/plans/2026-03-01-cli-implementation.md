# WhatsApp OpenCode CLI (`wao`) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the project into a globally installable CLI tool (`wao`) with service management capabilities.

**Architecture:** A `bin/wao.js` entry point uses `commander` to dispatch commands. `src/cli/` contains command logic. Background services are managed via `pm2`.

**Tech Stack:** Node.js, Commander.js, PM2, Inquirer, Ora.

---

### Task 1: CLI Entry Point & Skeleton

**Files:**
- Create: `bin/wao.js`
- Create: `src/cli/index.js`
- Modify: `package.json`

**Step 1: Write the failing test (CLI entry)**

Create `tests/cli.test.js`:
```javascript
const { exec } = require('child_process');
const path = require('path');

describe('CLI', () => {
  const cliPath = path.resolve(__dirname, '../bin/wao.js');

  test('should display help when run without arguments', (done) => {
    exec(`node ${cliPath}`, (error, stdout, stderr) => {
      expect(stdout).toContain('Usage: wao [options] [command]');
      done();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/cli.test.js`
Expected: FAIL (file not found or execution error)

**Step 3: Write minimal implementation**

Create `bin/wao.js`:
```javascript
#!/usr/bin/env node
const { program } = require('commander');
const { version } = require('../package.json');

program
  .name('wao')
  .description('WhatsApp OpenCode Bridge CLI')
  .version(version);

program.parse(process.argv);
```

Make it executable: `chmod +x bin/wao.js`

**Step 4: Run test to verify it passes**

Run: `npx jest tests/cli.test.js`
Expected: PASS

**Step 5: Add bin to package.json**

Modify `package.json`:
```json
  "bin": {
    "wao": "./bin/wao.js"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "pm2": "^5.3.1",
    // ... existing
  }
```

**Step 6: Commit**

```bash
git add bin/wao.js tests/cli.test.js package.json
git commit -m "feat: add CLI entry point"
```

### Task 2: Setup Command Integration

**Files:**
- Modify: `bin/wao.js`
- Create: `src/cli/commands/setup.js`
- Test: `tests/cli.test.js`

**Step 1: Write the failing test**

Add to `tests/cli.test.js`:
```javascript
  test('should have setup command', (done) => {
    exec(`node ${cliPath} --help`, (error, stdout) => {
      expect(stdout).toContain('setup');
      done();
    });
  });
```

**Step 2: Run test**

Run: `npx jest tests/cli.test.js`
Expected: FAIL (setup command missing)

**Step 3: Implement Setup Command**

Create `src/cli/commands/setup.js`:
```javascript
const { runSetup } = require('../../setup');

async function setup() {
  await runSetup();
}

module.exports = setup;
```

Modify `bin/wao.js`:
```javascript
// ... imports
const setupCommand = require('../src/cli/commands/setup');

program
  .command('setup')
  .description('Run interactive setup wizard')
  .action(setupCommand);

// ... parse
```

**Step 4: Run test**

Run: `npx jest tests/cli.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/setup.js bin/wao.js tests/cli.test.js
git commit -m "feat: add setup command"
```

### Task 3: Daemon Management (Start/Stop)

**Files:**
- Create: `src/daemon/manager.js`
- Create: `src/cli/commands/start.js`
- Create: `src/cli/commands/stop.js`
- Modify: `bin/wao.js`

**Step 1: Write the failing test (Mock PM2)**

Create `tests/daemon.test.js`:
```javascript
const pm2 = require('pm2');
const { start, stop } = require('../src/daemon/manager');

jest.mock('pm2');

describe('Daemon Manager', () => {
  test('start should call pm2.start', (done) => {
    pm2.connect.mockImplementation((cb) => cb(null));
    pm2.start.mockImplementation((opts, cb) => cb(null, []));
    pm2.disconnect.mockImplementation(() => {});

    start().then(() => {
      expect(pm2.start).toHaveBeenCalled();
      done();
    });
  });

  test('stop should call pm2.stop', (done) => {
    pm2.connect.mockImplementation((cb) => cb(null));
    pm2.stop.mockImplementation((name, cb) => cb(null));
    pm2.disconnect.mockImplementation(() => {});

    stop().then(() => {
      expect(pm2.stop).toHaveBeenCalledWith('whatsapp-opencode', expect.anything());
      done();
    });
  });
});
```

**Step 2: Run test**

Run: `npx jest tests/daemon.test.js`
Expected: FAIL

**Step 3: Implement Daemon Manager**

Create `src/daemon/manager.js`:
```javascript
const pm2 = require('pm2');
const path = require('path');

const APP_NAME = 'whatsapp-opencode';
const SCRIPT_PATH = path.resolve(__dirname, '../../src/index.js');

function connect() {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function start() {
  await connect();
  return new Promise((resolve, reject) => {
    pm2.start({
      name: APP_NAME,
      script: SCRIPT_PATH,
      // Add other pm2 options here
    }, (err, apps) => {
      pm2.disconnect();
      if (err) reject(err);
      else resolve(apps);
    });
  });
}

async function stop() {
  await connect();
  return new Promise((resolve, reject) => {
    pm2.stop(APP_NAME, (err) => {
      pm2.disconnect();
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { start, stop };
```

**Step 4: Run test**

Run: `npx jest tests/daemon.test.js`
Expected: PASS

**Step 5: Implement CLI Commands**

Create `src/cli/commands/start.js`:
```javascript
const { start } = require('../../daemon/manager');
const ora = require('ora');

module.exports = async function() {
  const spinner = ora('Starting background service...').start();
  try {
    await start();
    spinner.succeed('Service started successfully.');
  } catch (err) {
    spinner.fail(`Failed to start service: ${err.message}`);
  }
};
```

Create `src/cli/commands/stop.js`:
```javascript
const { stop } = require('../../daemon/manager');
const ora = require('ora');

module.exports = async function() {
  const spinner = ora('Stopping background service...').start();
  try {
    await stop();
    spinner.succeed('Service stopped successfully.');
  } catch (err) {
    spinner.fail(`Failed to stop service: ${err.message}`);
  }
};
```

Modify `bin/wao.js` to register commands.

**Step 6: Commit**

```bash
git add src/daemon/manager.js src/cli/commands/start.js src/cli/commands/stop.js bin/wao.js tests/daemon.test.js
git commit -m "feat: add start/stop daemon commands"
```
