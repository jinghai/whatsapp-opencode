# WhatsApp OpenCode CLI (`wao`) Design

> **Status**: Approved
> **Command Name**: `wao` (WhatsApp OpenCode)
> **Goal**: Create a CLI tool for easy installation, configuration, and management of the WhatsApp-OpenCode bridge.

## 1. Overview

Transform the project into a globally installable CLI tool (`npm install -g whatsapp-opencode`) that provides:
1.  **Easy Setup**: `wao setup` (TUI wizard).
2.  **Service Management**: `wao start`, `wao stop`, `wao status` (background daemon via PM2 or native).
3.  **Configuration**: `wao config` to view/edit settings.
4.  **Logs**: `wao logs` to view runtime logs.

## 2. User Experience

### Installation
```bash
npm install -g whatsapp-opencode
# or run directly
npx whatsapp-opencode setup
```

### CLI Commands
- `wao setup`: Run the interactive configuration wizard (already implemented, needs CLI integration).
- `wao start`: Start the bridge in background (daemon mode).
- `wao stop`: Stop the background service.
- `wao restart`: Restart the service.
- `wao status`: Check if service is running and view basic stats.
- `wao logs`: Stream logs from the background service.
- `wao config`: View current configuration.
- `wao help`: Show help message.

## 3. Architecture

### Directory Structure
```
bin/
  wao.js          # CLI entry point (shebang node)
src/
  cli/
    index.js      # CLI command dispatcher (Commander.js)
    commands/
      setup.js    # Wraps src/setup/index.js
      start.js    # Daemon management
      stop.js
      status.js
      logs.js
  daemon/
    manager.js    # PM2 integration logic
  index.js        # Main application entry (Server)
```

### Key Components

#### 1. CLI Entry Point (`bin/wao.js`)
- Uses `commander` to define commands.
- Delegates execution to `src/cli/commands/*.js`.

#### 2. Daemon Manager (`src/daemon/manager.js`)
- Uses `pm2` programmatic API (preferred) or `child_process` to manage the background process.
- Since user explicitly mentioned "resident background service", `pm2` is the most robust choice for Node.js.
- **Dependency**: Add `pm2` as a dependency (not devDependency).

#### 3. Configuration Management
- Config file location:
  - Global install: `~/.whatsapp-opencode/.env` or XDG config path.
  - Local install: `.env` in current directory.
- `wao` should detect where it's running. For `npx` usage, it might be tricky to persist config globally unless we explicitly use user home dir.
- **Decision**: Default to `~/.whatsapp-opencode/` for config and logs when running globally/CLI mode.

## 4. Implementation Plan

### Phase 1: CLI Skeleton & Refactor
1.  Move `src/setup` logic to support CLI invocation.
2.  Create `bin/wao.js` and `src/cli/`.
3.  Implement `setup` command.

### Phase 2: Daemon Management
1.  Implement `start`, `stop`, `status` using PM2 API.
2.  Ensure `start` uses the correct config path (`~/.whatsapp-opencode/.env`).

### Phase 3: Integration
1.  Update `package.json` `bin` field.
2.  Test global installation simulation (`npm link`).

## 5. Technical Stack
- **CLI Framework**: `commander` (standard, robust).
- **Process Manager**: `pm2` (programmatic API).
- **UI**: `inquirer`, `ora`, `chalk` (already used).
- **Config**: `dotenv` (loaded from custom path).

## 6. Testing Strategy
- **Unit Tests**: Test CLI command parsing and Daemon Manager logic (mocking PM2).
- **Integration**: Manual test via `npm link` to verify `wao` command works globally.
