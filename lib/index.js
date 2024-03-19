'use strict';

const { readdir, watch, stat } = require('node:fs');
const { join, sep } = require('node:path');
const READ_OPTS = { withFileTypes: true };

const access = (list, v) => !list.some(ignore => new RegExp(ignore).test(v));

function Watcher(path, watchers, err, stats) {
  if (err || watchers.has(path)) return;
  watchers.set(path, watch(path, Listen.bind(this, path)));
  if (!stats.isDirectory() || !this.options.deep) return;
  readdir(path, READ_OPTS, (err, files) => {
    !err && files.forEach(f => void (f.isDirectory() && this.watch(join(path, f.name))));
  });
}

function Listen(path, _, filename) {
  const target = path.endsWith(sep + filename) ? path : join(path, filename);
  if (!access(this.options.ignore, target)) return;
  stat(target, Submit.bind(this, target));
}

function Submit(target, err, stats) {
  const { deep, home } = this.options;
  const parsed = home ? target.replace(home, '') : target;
  if (err) return void (this.unwatch(target), this.emit('unlink', parsed));
  this.emit('change', parsed);
  if (!stats.isDirectory() || !deep) return;
  readdir(target, READ_OPTS, (err, files) => {
    !err && files.forEach(f => void (f.isDirectory() && this.watch(join(target, f.name))));
  });
}

module.exports = { Scheduler: require('./scheduler'), access, setWatcher: Watcher };
