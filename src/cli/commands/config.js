const dotenv = require('dotenv');
const path = require('path');
const { setLanguageFromEnv, t } = require('../../utils/i18n');

function maskKey(value) {
  if (!value) return '';
  if (value.length <= 8) return '*'.repeat(value.length);
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

module.exports = async function() {
  setLanguageFromEnv();
  dotenv.config();
  const opencodeUrl = process.env.OPENCODE_URL;
  if (!opencodeUrl) {
    console.log(t('configMissing'));
    return;
  }
  const config = {
    OPENCODE_URL: opencodeUrl,
    SILICONFLOW_KEY: maskKey(process.env.SILICONFLOW_KEY),
    ALLOWLIST: process.env.ALLOWLIST || '',
    WORKING_DIR: process.env.WORKING_DIR ? path.resolve(process.env.WORKING_DIR) : process.cwd(),
    DEBUG: process.env.DEBUG || 'false'
  };
  console.log(t('configTitleCli'));
  Object.entries(config).forEach(([k, v]) => {
    console.log(`${k}=${v}`);
  });
};
