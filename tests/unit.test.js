'use strict';

const Snitch = require('..');
const { EVENTS } = Snitch;
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');
const timers = require('node:timers/promises');
const fsp = fs.promises;

const CWD = process.cwd();
const WRITE_TIMEOUT = 1000;
const stringify = details =>
  JSON.stringify(details, (k, v) => (typeof v === 'bigint' ? v.toString() : v));

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
  } catch (err) {
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
  snitch.on(EVENTS.READY, () => (ready = true));
  snitch.on(EVENTS.CLOSE, () => (ready = false));
  snitch.on(EVENTS.EVENT, () => count++);
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
  await createTest(async (snitch, dir, resolve, reject) => {
    snitch.on(EVENTS.EVENT, (path, event, details) => {
      if (typeof details !== 'object') reject('Invalid typeof details');
      if (typeof path !== 'string') reject('Bad path: ' + path);
      if (path.includes('ignore')) reject('Filter is not working');
      if (event !== EVENTS.UNLINK) reject(`Wrong event: [${event}]:\n ${stringify(details)}`);
      resolve();
    });

    for (const file of ['file.ignore.ext', 'file1.ext']) {
      await fsp.writeFile(path.join(dir, file), '', 'utf8');
      await fsp.writeFile(path.join(dir, file), '1', 'utf8');
      await fsp.unlink(path.join(dir, file));
    }
  });
});

test('[Events] debounce + update/event', async () => {
  await createTest(async (snitch, dir, resolve, reject) => {
    var count = 0;
    snitch.on('event', (path, event, details) => {
      if (typeof details !== 'object') reject('Invalid typeof details');
      if (typeof path !== 'string') reject('Bad path: ' + path);
      if (path.includes('ignore')) reject('Filter is not working');
      if (event !== EVENTS.UPDATE && event !== EVENTS.NEW) {
        reject(`Wrong event: [${event}]:\n ${stringify(details)}`);
      }

      if (++count === 2) resolve();
    });

    for (const file of ['file.ignore.ext', 'file1.ext']) {
      await fsp.writeFile(path.join(dir, file), '', 'utf8');
      await timers.setTimeout(800); //? To Escape optimizations
      await fsp.writeFile(path.join(dir, file), '123', 'utf8');
    }
  });
});

test('[Events] debounce + new/event', async () => {
  await createTest(async (snitch, dir, resolve, reject) => {
    snitch.on('event', (path, event, details) => {
      if (typeof details !== 'object') reject('Invalid typeof details');
      if (typeof path !== 'string') reject('Bad path: ' + path);
      if (path.includes('ignore')) reject('Filter is not working');
      if (event !== EVENTS.NEW) reject(`Wrong event: [${event}]:\n ${stringify(details)}`);
      resolve();
    });

    for (const file of ['file.ignore.ext', 'file1.ext']) {
      await fsp.writeFile(path.join(dir, file), '', 'utf8');
    }
  });
});

test('[Events] Event optimization', async () => {
  await createTest(async (snitch, dir, resolve, reject) => {
    snitch.on('event', (path, event, details) => {
      if (typeof details !== 'object') reject('Invalid typeof details');
      if (typeof path !== 'string') reject('Bad path: ' + path);
      if (path.includes('ignore')) reject('Filter is not working');
      if (event !== EVENTS.NEW) reject(`Wrong event: [${event}]:\n ${stringify(details)}`);
      resolve();
    });

    for (const file of ['file.ignore.ext', 'file1.ext']) {
      await fsp.writeFile(path.join(dir, file), '', 'utf8');
      await fsp.writeFile(path.join(dir, file), '123', 'utf8');
    }
  });
});

test('[Events] callback', async () => {
  const dirLocation = path.join(CWD, 'tests', 'samples', 'dir' + Math.random().toFixed(5));
  const filter = f => !f.includes('ignore');
  const snitch = new Snitch({ filter, timeout: 700, home: CWD, recursive: true });
  await fsp.mkdir(dirLocation, { recursive: true });

  const result = await new Promise((resolve, reject) => {
    setTimeout(() => reject('Timeout'), 3000);
    snitch.watchSync(dirLocation, (event, path, details) => {
      if (typeof details !== 'object') reject('Invalid typeof details');
      if (typeof path !== 'string') reject('Bad path: ' + path);
      if (path.includes('ignore')) reject('Filter is not working');
      if (event !== 'new') reject(`Wrong event: [${event}]:\n ${stringify(details)}`);
      resolve();
    });
    fsp.writeFile(path.join(dirLocation, 'file1.ignore.ext'), '', 'utf8');
    fsp.writeFile(path.join(dirLocation, 'file2.ext'), '', 'utf8');
  }).then(...[e => [true, e], e => [false, e]]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  if (!result[0]) throw new Error(result[1]);
});

test('[Events] before/after/event', async () => {
  await createTest(async (snitch, dir, resolve, reject) => {
    var count = 0;
    var eventCount = 0;
    const res = (c = ++count) => c === 3 && resolve();

    snitch.on('event', () => {
      if (++eventCount === 2) res();
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

    for (const file of ['file.ignore.ext', 'file1.ext', 'file2.ext']) {
      await fsp.writeFile(path.join(dir, file), '', 'utf8');
    }
  });
});

test('[Events] recursive', async () => {
  const options = { timeout: 700, home: CWD, recursive: true };
  createTest(async (snitch, dir, resolve, reject) => {
    var count = 0;
    const nestedLocation = path.join(dir, 'nested');
    snitch.on('event', (path, event) => {
      if (!path.includes('nested')) reject();
      if (event === 'new') count++;
      if (count === 2) resolve();
    });

    await fsp.mkdir(nestedLocation);
    await fsp.writeFile(path.join(nestedLocation, 'file1.ext'), '', 'utf8');
  }, options);
});

const filter = f => !f.includes('ignore');
async function createTest(callback, options = { timeout: 700, home: CWD, filter }) {
  const dirLocation = path.join(CWD, 'tests', 'samples', 'dir' + Math.random().toFixed(5));
  const snitch = new Snitch(options);
  await fsp.mkdir(dirLocation, { recursive: true });
  await snitch.watch(dirLocation);

  const result = await new Promise((resolve, reject) => {
    setTimeout(() => reject('Timeout'), 3000);
    callback(snitch, dirLocation, resolve, reject);
  }).then(...[e => [true, e], e => [false, e]]);

  snitch.clear().removeAllListeners();
  await fsp.rm(dirLocation, { recursive: true, force: true });
  if (!result[0]) throw new Error(result[1]);
}
