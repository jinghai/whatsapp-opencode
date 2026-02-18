// Test setup file
process.env.NODE_ENV = 'test';
process.env.OPENCODE_URL = 'http://localhost:4096';
process.env.SILICONFLOW_KEY = 'test_key';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test timeouts
jest.setTimeout(30000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
