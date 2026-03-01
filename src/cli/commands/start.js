const { start } = require('../../daemon/manager');
const ora = require('ora');
const { setLanguageFromEnv, t } = require('../../utils/i18n');

module.exports = async function() {
  setLanguageFromEnv();
  const spinner = ora(t('serviceStarting')).start();
  try {
    await start();
    spinner.succeed(t('serviceStarted'));
  } catch (err) {
    spinner.fail(t('serviceStartFailed', { message: err.message }));
  }
};
