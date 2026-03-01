#!/usr/bin/env node
const { execSync } = require('child_process');

function sh(command) {
  return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

function safeSh(command) {
  try {
    return sh(command);
  } catch (error) {
    return '';
  }
}

function detectBumpFromCommits() {
  const lastTag = safeSh('git describe --tags --abbrev=0');
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const raw = safeSh(`git log --pretty=%s ${range}`);
  if (!raw) return 'none';

  const subjects = raw.split('\n').map(line => line.trim()).filter(Boolean);
  const hasFeat = subjects.some(subject => /^feat(\(.+\))?:/i.test(subject));
  const hasFix = subjects.some(subject => /^fix(\(.+\))?:/i.test(subject));

  if (hasFeat) return 'minor';
  if (hasFix) return 'patch';
  return 'none';
}

function main() {
  const mode = (process.argv[2] || 'auto').trim().toLowerCase();
  const manualAllowed = new Set(['major', 'minor', 'patch']);
  if (manualAllowed.has(mode)) {
    console.log(mode);
    return;
  }
  console.log(detectBumpFromCommits());
}

main();
