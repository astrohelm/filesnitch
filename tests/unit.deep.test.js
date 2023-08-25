'use strict';

const Watcher = require('..');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert');

const CWD = process.cwd();
const TEST_TIMEOUT = 2000;
const WRITE_TIMEOUT = 500;
const cleanup = dir => fs.rmSync(dir, { recursive: true, force: true });

test('Aggregated change & ignore patterns', async () => {
  let flag = false;
  const dir = path.join(CWD, 'tests/example_aggregated');
  const files = ['file1.ext', 'file2.ext', 'file3.ext', 'file4.ignore.ext', 'file5.ignore.ext'];
  fs.mkdirSync(dir);
  const watcher = new Watcher({ timeout: 200, ignore: ['file[0-9]\\.ignore\\.ext'], home: CWD });
  watcher.watch(dir);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    let changeCount = 0;

    watcher.on('change', path => {
      assert.strictEqual(path.endsWith('.ext'), true);
      changeCount++;
    });

    watcher.on('before', changes => {
      assert.strictEqual(changes.length, 3);
    });

    watcher.on('after', changes => {
      assert.strictEqual(changeCount, 3);
      assert.strictEqual(changes.length, 3);
      clearTimeout(timeout);
      flag = true;
      resolve();
    });

    setTimeout(() => {
      for (const name of files) {
        const filePath = path.join(dir, name);
        fs.writeFile(filePath, 'example', 'utf8', err => err && reject(err, 'Can not write file'));
      }
    }, WRITE_TIMEOUT);
  }).catch(err => console.error(err));

  watcher.close();
  cleanup(dir);
  assert.strictEqual(flag, true);
});

test('Nested folder', async () => {
  let flag = false;
  const dir = path.join(CWD, 'tests/example_nested');
  const deepDir = path.join(dir, 'deep');
  const deepFile = path.join(deepDir, 'file.ext');

  fs.mkdirSync(dir);
  fs.mkdirSync(deepDir);
  fs.writeFileSync(deepFile, 'create', 'utf8');
  const watcher = new Watcher({ timeout: 200, deep: true });
  watcher.watch(dir);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    let counter = 0;
    watcher.on('delete', () => void counter++);

    watcher.on('after', changes => {
      assert.strictEqual(counter, 2);
      assert.strictEqual(changes.length, 2);
      clearTimeout(timeout);
      flag = true;
      resolve();
    });
    setTimeout(() => {
      fs.rm(deepDir, { recursive: true }, err => err && reject(err));
    }, WRITE_TIMEOUT);
  }).catch(err => console.error(err));

  watcher.close();
  cleanup(dir);
  assert.strictEqual(flag, true);
});
