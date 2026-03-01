jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('pino', () => {
  const fn = jest.fn(() => ({ info: jest.fn() }));
  fn.destination = jest.fn(() => ({}));
  fn.stdTimeFunctions = { isoTime: () => 'x' };
  return fn;
});

const fs = require('fs');
const P = require('pino');
const { createLogger } = require('../src/utils/logger');

describe('logger util', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create logs directory when missing', () => {
    fs.existsSync.mockReturnValue(false);
    createLogger('/tmp/work', { debug: true });
    expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/work/logs', { recursive: true });
    expect(P.destination).toHaveBeenCalled();
  });
});
