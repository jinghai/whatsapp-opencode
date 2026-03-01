const { stop } = require('../../daemon/manager');
const ora = require('ora');
const { setLanguageFromEnv, t } = require('../../utils/i18n');

module.exports = async function() {
  setLanguageFromEnv();
  const spinner = ora(t('serviceStopping')).start();
  try {
    await stop();
    spinner.succeed(t('serviceStopped'));
  } catch (err) {
    spinner.fail(t('serviceStopFailed', { message: err.message }));
  }
};
