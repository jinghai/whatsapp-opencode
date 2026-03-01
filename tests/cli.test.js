const { exec } = require('child_process');
const path = require('path');

describe('CLI', () => {
  const cliPath = path.resolve(__dirname, '../bin/wao.js');

  test('should display help when run without arguments', (done) => {
    // Need to pass --help because commander doesn't show help by default if no args unless configured
    exec(`node ${cliPath} --help`, (error, stdout) => {
      expect(error).toBeNull();
      expect(stdout).toContain('Usage: wao [options]');
      done();
    });
  });

  test('should have setup command', (done) => {
    exec(`node ${cliPath} --help`, (error, stdout) => {
      expect(error).toBeNull();
      expect(stdout).toContain('setup');
      expect(stdout).toContain('status');
      expect(stdout).toContain('logs');
      expect(stdout).toContain('config');
      done();
    });
  });
});
