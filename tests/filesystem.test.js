jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

const fs = require('fs');
const { ensureDir, readJson, writeJson } = require('../src/utils/filesystem');

describe('filesystem utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ensureDir should create directory when missing', () => {
    fs.existsSync.mockReturnValue(false);
    ensureDir('/tmp/new-dir');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/tmp/new-dir', { recursive: true });
  });

  test('readJson should return fallback on parse error', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{bad json');
    expect(readJson('/tmp/a.json', { users: {} })).toEqual({ users: {} });
  });

  test('writeJson should write pretty json', () => {
    writeJson('/tmp/a.json', { a: 1 });
    expect(fs.writeFileSync).toHaveBeenCalledWith('/tmp/a.json', '{\n  "a": 1\n}');
  });
});
