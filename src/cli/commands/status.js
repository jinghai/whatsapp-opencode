const { describe } = require('../../daemon/manager');
const { setLanguageFromEnv, t } = require('../../utils/i18n');

module.exports = async function() {
  setLanguageFromEnv();
  try {
    const apps = await describe();
    if (!apps || apps.length === 0) {
      console.log(t('serviceStatusStopped'));
      return;
    }
    const app = apps[0];
    const status = app.pm2_env?.status;
    if (status === 'online') {
      console.log(t('serviceStatusRunning'));
    } else if (status) {
      console.log(`${t('serviceStatusUnknown')} ${status}`);
    } else {
      console.log(t('serviceStatusUnknown'));
    }
  } catch (error) {
    console.log(t('serviceStatusUnknown'));
  }
};
