const P = require('pino');
const path = require('path');
const fs = require('fs');

function createLogger(workingDir, options = {}) {
  const debug = typeof options === 'boolean' ? options : (options.debug || false);
  const sync = typeof options === 'object' && options.sync === true;

  const logsDir = path.join(workingDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  const logFile = path.join(logsDir, 'wa-bridge.log');
  
  return P(
    { 
      level: debug ? 'debug' : 'info',
      timestamp: P.stdTimeFunctions ? P.stdTimeFunctions.isoTime : () => `,"time":"${new Date().toISOString()}"`
    }, 
    P.destination({ dest: logFile, sync })
  );
}

module.exports = { createLogger };
