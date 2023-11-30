'use strict';

const { access: accessible, scheduler } = require('./lib');
const { stat, readdir, watch } = require('node:fs');
const { EventEmitter } = require('node:events');
const { join, sep } = require('node:path');
module.exports = Watcher;
module.exports.default = Watcher;

const READ_OPTS = { withFileTypes: true };
Object.setPrototypeOf(Watcher.prototype, EventEmitter.prototype);
function Watcher(options = {}) {
  EventEmitter.call(this);
  const { timeout, ignore = [], home, deep } = options;
  const access = accessible.bind(null, [...ignore]);

  const lookup = path => (err, files) =>
    void (!err && files.forEach(f => f.isDirectory() && this.watch(join(path, f.name))));

  const emit = scheduler(timeout, this.emit.bind(this));
  const listener = path => (_, filename) => {
    const target = path.endsWith(sep + filename) ? path : join(path, filename);
    if (!access(target)) return;
    stat(target, (err, stats) => {
      const parsed = home ? target.replace(home, '') : target;
      if (err) return void (this.unwatch(target), emit('delete', parsed));
      stats.isDirectory() && deep && readdir(target, READ_OPTS, lookup(path));
      return void emit('change', parsed);
    });
  };

  const watchers = new Map();
  this.close = () => (this.clear(), this.removeAllListeners(), this);
  this.clear = () => (watchers.forEach(watcher => watcher.close()), watchers.clear(), this);
  this.unwatch = path => (watchers.get(path)?.close(), watchers.delete(path), this);
  this.watch = path => {
    if (watchers.has(path) || !access(path)) return this;
    stat(path, (err, stats) => {
      if (err || watchers.has(path)) return;
      watchers.set(path, watch(path, listener(path)));
      stats.isDirectory() && deep && readdir(path, READ_OPTS, lookup(path));
    });
    return this;
  };
}
