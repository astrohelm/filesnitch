'use strict';

const Snitch = require('..');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');
const timers = require('node:timers/promises');
const fsp = fs.promises;

const CWD = process.cwd();
const WRITE_TIMEOUT = 1000;

test('Basics', () => {
  assert(process.versions.node.split('.').map(Number)[0] >= 22);

  const snitch = new Snitch();
  assert(snitch.isActive());
  snitch.close();
  assert(!snitch.isActive());
  snitch.open();
  assert(snitch.isActive());
});

test('Filter', () => {
  const tests = [
    { filter: 'file[0-9]\\.ext', sampleT: 'file0.ext', sampleF: 'file.ext' },
    { filter: new RegExp('HeLLo'), sampleT: 'HeLLo', sampleF: 'Hello.ext' },
    { filter: /f[0-9]+/, sampleT: 'f100', sampleF: 'f.ext' },
    { filter: file => file.endsWith('.js'), sampleT: 'file.js', sampleF: 'file.mjs' },
  ];

  for (var { filter, sampleT, sampleF } of tests) {
    var snitch = new Snitch({ filter });
    assert(snitch.predict(sampleT) === true);
    assert(snitch.predict(sampleF) === false);
  }
});

test('Async watcher', async () => {
  const location = path.join(CWD, 'tests', 'example.txt');
  const snitch = new Snitch();
  assert(await snitch.watch(location).then(...[() => false, () => true]));
  await fsp.writeFile(location, '', 'utf8');
  assert(await snitch.watch(location).then(...[() => true, () => false]));
  assert(snitch.observed.length === 1);
  await fsp.rm(location);
  await timers.setTimeout(WRITE_TIMEOUT);
  assert(snitch.observed.length === 0);
});

test('Sync watcher', async () => {
  const location = path.join(CWD, 'tests', 'example.txt');
  const snitch = new Snitch();

  try {
    snitch.watchSync(location);
    assert(false);
  } catch {
    assert(true);
  }

  await fsp.writeFile(location, '', 'utf8');

  try {
    snitch.watchSync(location);
    assert(true);
  } catch {
    assert(false);
  }

  assert(snitch.observed.length === 1);
  await fsp.rm(location);
  await timers.setTimeout(WRITE_TIMEOUT);
  assert(snitch.observed.length === 0);
});

test('[Events] ready/close/event', async () => {
  var ready = false;
  var count = 0;
  const snitch = new Snitch();
  snitch.on('ready', () => (ready = true));
  snitch.on('close', () => (ready = false));
  snitch.on('event', () => count++);
  assert(!ready);
  await timers.setImmediate();
  assert(ready);
  snitch.close();
  assert(!ready);
  snitch.open();
  assert(ready);
  snitch.close();
  assert(!ready);
  assert(count === 0);
});

test('[Events] debounce + unlink/event', async () => {
  const dirLocation = path.join(CWD, 'tests', 'dir' + Math.random().toFixed(5));
  const files = ['file1.ignore.ext', 'file2.ext'];
  const filter = f => !f.includes('ignore');
  const snitch = new Snitch({ filter, timeout: 200, home: CWD, recursive: true });
  await fsp.mkdir(dirLocation);
  await snitch.watch(dirLocation);

  const wait = async cb => Promise.all(files.map(cb));
  await wait(name => fsp.writeFile(path.join(dirLocation, name), '', 'utf8'));
  await wait(name => fsp.writeFile(path.join(dirLocation, name), '1', 'utf8'));
  await wait(name => fsp.unlink(path.join(dirLocation, name)));

  const result = await new Promise((resolve, reject) => {
    setTimeout(reject, 1000);
    snitch.on('event', (path, event, details) => {
      if (typeof details !== 'object') reject();
      if (typeof path !== 'string') reject();
      if (path.includes('ignore')) reject();
      if (event !== 'unlink') reject();
      resolve();
    });
  }).then(...[() => true, () => false]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  assert(result);
});

test('[Events] debounce + update/event', async () => {
  const dirLocation = path.join(CWD, 'tests', 'dir' + Math.random().toFixed(5));
  const files = ['file1.ignore.ext', 'file2.ext'];
  const filter = f => !f.includes('ignore');
  const snitch = new Snitch({ filter, timeout: 200, home: CWD, recursive: true });
  await fsp.mkdir(dirLocation);
  await snitch.watch(dirLocation);

  const wait = async cb => Promise.all(files.map(cb));
  await wait(name => fsp.writeFile(path.join(dirLocation, name), '', 'utf8'));
  await wait(name => fsp.writeFile(path.join(dirLocation, name), '1', 'utf8'));

  const result = await new Promise((resolve, reject) => {
    setTimeout(reject, 1000);
    snitch.on('event', (path, event, details) => {
      if (typeof details !== 'object') reject();
      if (typeof path !== 'string') reject();
      if (path.includes('ignore')) reject();
      if (event !== 'update') reject();
      resolve();
    });
  }).then(...[() => true, () => false]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  assert(result);
});

test('[Events] debounce + new/event', async () => {
  const dirLocation = path.join(CWD, 'tests', 'dir' + Math.random().toFixed(5));
  const files = ['file1.ignore.ext', 'file2.ext'];
  const filter = f => !f.includes('ignore');
  const snitch = new Snitch({ filter, timeout: 200, home: CWD, recursive: true });
  await fsp.mkdir(dirLocation);
  await snitch.watch(dirLocation);

  const wait = async cb => Promise.all(files.map(cb));
  await wait(name => fsp.writeFile(path.join(dirLocation, name), '', 'utf8'));

  const result = await new Promise((resolve, reject) => {
    setTimeout(reject, 1000);
    snitch.on('event', (path, event, details) => {
      if (typeof details !== 'object') reject();
      if (typeof path !== 'string') reject();
      if (path.includes('ignore')) reject();
      if (event !== 'new') reject();
      resolve();
    });
  }).then(...[() => true, () => false]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  assert(result);
});

test('[Events] callback', async () => {
  const dirLocation = path.join(CWD, 'tests', 'dir' + Math.random().toFixed(5));
  const filter = f => !f.includes('ignore');
  const snitch = new Snitch({ filter, timeout: 200, home: CWD, recursive: true });
  await fsp.mkdir(dirLocation);

  const result = await new Promise((resolve, reject) => {
    setTimeout(reject, 1000);
    snitch.watchSync(dirLocation, (event, path, details) => {
      if (typeof details !== 'object') reject();
      if (typeof path !== 'string') reject();
      if (path.includes('ignore')) reject();
      if (event === 'new') resolve();
    });
    fsp.writeFile(path.join(dirLocation, 'file1.ignore.ext'), '', 'utf8');
    fsp.writeFile(path.join(dirLocation, 'file2.ext'), '', 'utf8');
  }).then(...[() => true, () => false]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  assert(result);
});

test('[Events] before/after/event', async () => {
  const dirLocation = path.join(CWD, 'tests', 'dir' + Math.random().toFixed(5));
  const files = ['file1.ignore.ext', 'file2.ext', 'file3.ext'];
  const filter = f => !f.includes('ignore');
  const snitch = new Snitch({ filter, timeout: 200, home: CWD, recursive: true });
  await fsp.mkdir(dirLocation);
  await snitch.watch(dirLocation);

  const wait = async cb => Promise.all(files.map(cb));
  await wait(name => fsp.writeFile(path.join(dirLocation, name), '', 'utf8'));

  const result = await new Promise((resolve, reject) => {
    setTimeout(reject, 1000);
    var count = 0;
    var eventCount = 0;
    const res = (c = ++count) => c === 3 && resolve();

    snitch.on('event', () => {
      eventCount++;
      if (eventCount === 2) res();
    });

    snitch.on('before', packet => {
      if (typeof packet !== 'object') reject();
      if (typeof packet[0] !== 'object') reject();
      if (packet.length !== 2) reject();
      if (typeof packet[0][0] !== 'string') reject();
      if (typeof packet[0][1] !== 'object') reject();
      if (typeof packet[0][1][0] !== 'string') reject();
      if (typeof packet[0][1][1] !== 'object') reject();
      if (packet[0][0].includes('ignore')) reject();
      if (packet[0][1][0] !== 'new') reject();
      res();
    });

    snitch.on('after', packet => {
      if (typeof packet !== 'object') reject();
      if (typeof packet[0] !== 'object') reject();
      if (packet.length !== 2) reject();
      if (typeof packet[0][0] !== 'string') reject();
      if (typeof packet[0][1] !== 'object') reject();
      if (typeof packet[0][1][0] !== 'string') reject();
      if (typeof packet[0][1][1] !== 'object') reject();
      if (packet[0][0].includes('ignore')) reject();
      if (packet[0][1][0] !== 'new') reject();
      res();
    });
  }).then(...[() => true, () => false]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  assert(result);
});

test('[Events] recursive', async () => {
  const dirLocation = path.join(CWD, 'tests', 'dir' + Math.random().toFixed(5));
  const nestedLocation = path.join(dirLocation, 'nested');
  const files = ['file1.ignore.ext', 'file2.ext'];
  const filter = f => !f.includes('ignore');
  const snitch = new Snitch({ filter, timeout: 200, home: CWD, recursive: true });
  await fsp.mkdir(dirLocation);
  await snitch.watch(dirLocation);

  await fsp.mkdir(nestedLocation);
  const wait = async cb => Promise.all(files.map(cb));
  await wait(name => fsp.writeFile(path.join(nestedLocation, name), '', 'utf8'));

  const result = await new Promise((resolve, reject) => {
    setTimeout(reject, 1000);
    var count = 0;
    snitch.on('event', (path, event) => {
      if (!path.includes('nested')) reject();
      if (event === 'new') count++;
      if (count === 2) resolve();
    });
  }).then(...[() => true, () => false]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  assert(result);
});
