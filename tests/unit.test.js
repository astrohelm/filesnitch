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

test('Dir file', async () => {
  let flag = false;
  const dir = path.join(CWD, 'tests/example_dir');
  const file = path.join(dir, 'file.ext');
  fs.mkdirSync(dir);
  fs.writeFileSync(file, 'create', 'utf8');
  const watcher = new Watcher({ timeout: 200 });
  watcher.watch(dir);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    watcher.once('change', file => {
      assert.strictEqual(file.endsWith(path.sep + 'file.ext'), true);
      clearTimeout(timeout);
      flag = true;
      resolve();
    });
    setTimeout(() => {
      fs.writeFile(file, 'update', 'utf8', err => err && reject(err, 'Can not write file'));
    }, WRITE_TIMEOUT);
  }).catch(err => console.error(err));

  watcher.close();
  cleanup(dir);
  assert.strictEqual(flag, true);
});

test('Specific file', async () => {
  let flag = false;
  const dir = path.join(CWD, 'tests/example_file');
  const file = path.join(dir, 'file.ext');
  fs.mkdirSync(dir);
  fs.writeFileSync(file, 'create', 'utf8');
  const watcher = new Watcher({ timeout: 200 });
  watcher.watch(file);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    watcher.once('change', file => {
      assert.strictEqual(file.endsWith(path.sep + 'file.ext'), true);
      clearTimeout(timeout);
      flag = true;
      resolve();
    });
    setTimeout(() => {
      fs.writeFile(file, 'update', 'utf8', err => err && reject(err, 'Can not write file'));
    }, WRITE_TIMEOUT);
  }).catch(err => console.error(err));

  watcher.close();
  cleanup(dir);
  assert.strictEqual(flag, true);
});

test('New file', async () => {
  let flag = false;
  const dir = path.join(CWD, 'tests/example_file_rename');
  const file = path.join(dir, 'file.ext');
  fs.mkdirSync(dir);
  fs.writeFileSync(file, 'create', 'utf8');
  const watcher = new Watcher({ timeout: 200 });
  watcher.watch(dir);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    watcher.once('change', file => {
      assert.strictEqual(file.endsWith(path.sep + 'file.ext2'), true);
      clearTimeout(timeout);
      flag = true;
      resolve();
    });
    fs.writeFile(file + 2, 'create', 'utf8', err => err && reject(err, 'Can not write file'));
  }).catch(err => console.error(err));

  watcher.close();
  cleanup(dir);
  assert.strictEqual(flag, true);
});

test('Remove file', async () => {
  let flag = false;
  const dir = path.join(CWD, 'tests/example_file_remove');
  const file = path.join(dir, 'file.ext');
  fs.mkdirSync(dir);
  fs.writeFileSync(file, 'create', 'utf8');
  const watcher = new Watcher({ timeout: 200 });
  watcher.watch(dir);

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject('timeout'), TEST_TIMEOUT);
    watcher.once('delete', file => {
      assert.strictEqual(file.endsWith(path.sep + 'file.ext'), true);
      clearTimeout(timeout);
      flag = true;
      resolve();
    });
    fs.rm(file, err => err && reject(err, 'Can not write file'));
  }).catch(err => console.error(err));

  watcher.close();
  cleanup(dir);
  assert.strictEqual(flag, true);
});
