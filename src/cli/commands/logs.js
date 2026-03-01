const fs = require('fs');
const { describe } = require('../../daemon/manager');
const { setLanguageFromEnv, t } = require('../../utils/i18n');

function tailLines(content, lines) {
  const parts = content.split('\n');
  return parts.slice(Math.max(parts.length - lines, 0)).join('\n');
}

function readTail(path, lines) {
  if (!path || !fs.existsSync(path)) {
    console.log(t('serviceLogsMissing', { path }));
    return;
  }
  const content = fs.readFileSync(path, 'utf-8');
  console.log(t('serviceLogsTitle', { lines }));
  console.log(tailLines(content, lines));
}

module.exports = async function() {
  setLanguageFromEnv();
  try {
    const apps = await describe();
    if (!apps || apps.length === 0) {
      console.log(t('serviceStatusStopped'));
      return;
    }
    const app = apps[0];
    const outPath = app.pm2_env?.out_log_path;
    const errPath = app.pm2_env?.err_log_path;
    const lines = 200;
    if (outPath) readTail(outPath, lines);
    if (errPath && errPath !== outPath) readTail(errPath, lines);
  } catch (error) {
    console.log(t('serviceStatusUnknown'));
  }
};
