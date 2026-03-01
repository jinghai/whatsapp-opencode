const pm2 = require('pm2');
const path = require('path');

const APP_NAME = 'whatsapp-opencode';
const SCRIPT_PATH = path.resolve(__dirname, '../index.js');

function connect() {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function start() {
  await connect();
  return new Promise((resolve, reject) => {
    pm2.start({
      name: APP_NAME,
      script: SCRIPT_PATH,
      cwd: process.cwd()
      // Add other pm2 options here if needed
    }, (err, apps) => {
      pm2.disconnect();
      if (err) reject(err);
      else resolve(apps);
    });
  });
}

async function stop() {
  await connect();
  return new Promise((resolve, reject) => {
    pm2.stop(APP_NAME, (err) => {
      pm2.disconnect();
      if (err) reject(err);
      else resolve();
    });
  });
}

async function describe() {
  await connect();
  return new Promise((resolve, reject) => {
    pm2.describe(APP_NAME, (err, apps) => {
      pm2.disconnect();
      if (err) reject(err);
      else resolve(apps || []);
    });
  });
}

module.exports = { start, stop, describe };
