# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WhatsApp OpenCode Bridge is a Node.js application that enables controlling OpenCode AI assistant through WhatsApp messages. It provides a CLI tool (`wao`) and acts as a bidirectional sync bridge between WhatsApp and OpenCode API.

## Development Commands

### Testing
```bash
npm test                    # Run all tests
npm run test:coverage       # Run tests with coverage report
jest <test-file>            # Run specific test file
```

### Linting
```bash
npm run lint                # Run ESLint
```

### Running the Service
```bash
npm start                   # Run directly (requires .env configuration)
node bin/wao.js setup       # Interactive setup wizard
node bin/wao.js start       # Start as PM2 daemon
node bin/wao.js stop        # Stop daemon
node bin/wao.js status      # Check PM2 status
node bin/wao.js logs        # View PM2 logs
```

## Architecture

### Core Components

**Entry Points:**
- `bin/wao.js` - CLI entry point using Commander.js
- `src/index.js` - Application entry point that launches the bridge

**Bridge Layer** (`src/bridge/`):
- `sync.js` - Core synchronization logic between WhatsApp and OpenCode
  - Manages WhatsApp connection lifecycle
  - Handles incoming WhatsApp messages
  - Streams OpenCode responses to WhatsApp
  - Implements multi-user session isolation
  - Polls OpenCode for TUI-originated messages
  - Session expiry management (1 hour timeout)

- `handlers.js` - Message processing utilities
  - Command parsing (`/new`, `/help`)
  - Task type detection (brainstorming, debugging, tdd, git)
  - Allowlist validation

**Services** (`src/services/`):
- `opencodeClient.js` - HTTP client for OpenCode REST API
  - Session creation and retrieval
  - Message listing
  - Async prompt submission

- `whatsappClient.js` - WhatsApp client wrapper using @whiskeysockets/baileys
  - QR code authentication
  - Connection state management
  - Message event handling

- `transcriber.js` - Audio transcription using SiliconFlow API

**CLI Commands** (`src/cli/commands/`):
- Each command (setup, start, stop, status, logs, config) is a separate module
- Commands use the daemon manager for process control

**Daemon Manager** (`src/daemon/manager.js`):
- PM2 wrapper for running the bridge as a background process
- Provides start, stop, and describe functionality

**Configuration** (`src/config/`):
- Loads from `.env` file using dotenv
- Required: `OPENCODE_URL`, `ALLOWLIST`
- Optional: `SILICONFLOW_KEY`, `WORKING_DIR`, `DEBUG`

### Key Data Structures

**State Management** (`data/state.json`):
```javascript
{
  users: {
    "[jid]": {
      sessionId: "opencode-session-id",
      lastIndex: -1,
      lastActivity: timestamp
    }
  },
  processingUsers: Set<jid>  // Users currently being processed
}
```

**Directory Structure** (created in working directory):
- `auth/` - WhatsApp authentication state
- `logs/` - Application logs
- `media/` - Downloaded images/audio
- `data/` - State persistence

### Message Flow

1. **WhatsApp → OpenCode:**
   - User sends message on WhatsApp
   - Message downloaded (if media) and transcribed (if audio)
   - Text enhanced with task type hint
   - OpenCode session retrieved/created for user
   - Prompt sent asynchronously to OpenCode
   - Response streamed back in chunks >20 characters
   - Tool approval requests sent for sensitive operations

2. **OpenCode TUI → WhatsApp:**
   - Poll loop (2s interval) checks OpenCode messages
   - User messages starting from TUI are forwarded to WhatsApp
   - Assistant responses are forwarded with context

3. **Multi-user Isolation:**
   - Each WhatsApp user gets their own OpenCode session
   - Sessions stored per user JID in state
   - Expired sessions (>1 hour) automatically cleaned

## Important Implementation Details

### Streaming Response Logic
- OpenCode responses are streamed character-by-character
- Chunks sent when >20 characters accumulated or message finished (`finish: 'stop'`)
- Tool state checked for approval requirements or running status
- Timeout after 600 seconds with automatic session reset

### Permission Handling
- Sensitive operations (requires_approval/requires_action) pause streaming
- User must respond on WhatsApp to proceed
- Prevents automatic execution of destructive operations

### WhatsApp Authentication
- Uses multi-file auth state in `auth/` directory
- QR code displayed in terminal on first run
- Auto-reconnects on disconnection
- Clears auth on logged out event

### Internationalization
- `src/utils/i18n.js` provides basic i18n support
- Language detected from `LANG` environment variable

## Testing

- Tests located in `tests/` directory
- Use Jest with setup file `tests/setup.js`
- Mock pino logger to avoid file I/O issues
- Test coverage includes command parsing, task detection, allowlist validation, and sync logic
- Integration tests for CLI setup workflow

## Commit Convention

Follow Conventional Commits:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation
- `test`: Test additions/changes
- `chore`: Build/tooling changes

## Release Process

1. Update version in package.json
2. Update RELEASE_NOTES.md
3. Create git tag: `git tag v<version>`
4. Push tag: `git push origin v<version>`
5. GitHub Actions automatically runs tests and publishes to npm
