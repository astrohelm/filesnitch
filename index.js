'use strict';

const { stat, readdir, watch } = require('node:fs');
const { EventEmitter } = require('node:events');
const { access, scheduler } = require('./lib');
const { join, sep } = require('node:path');
const READ_OPTS = { withFileTypes: true };
const kWatchers = Symbol('watchers');
const kListener = Symbol('listener');
const kOptions = Symbol('options');
const kLookup = Symbol('lookup');
const kEmit = Symbol('emit');

module.exports.default = module.exports = class Watcher extends EventEmitter {
  static watch = (path, options) => new Watcher(options).watch(path);
  static symbols = { kEmit, kListener, kLookup, kOptions, kWatchers };
  constructor(options = {}) {
    super();
    this[kWatchers] = new Map();
    this[kEmit] = scheduler(this, options.timeout);
    this[kOptions] = { ...options, ignore: options.ignore ?? [] };
  }

  [kLookup](path) {
    const lookup = f => void (f.isDirectory() && this.watch(join(path, f.name)));
    return (err, files) => void (!err && files.forEach(lookup));
  }

  [kListener](path) {
    const { home, deep, ignore } = this[kOptions];
    return (_, filename) => {
      const target = path.endsWith(sep + filename) ? path : join(path, filename);
      if (!access(ignore, target)) return;
      stat(target, (err, stats) => {
        const parsed = home ? target.replace(home, '') : target;
        if (err) return void (this.unwatch(target), this[kEmit]('unlink', parsed));
        stats.isDirectory() && deep && readdir(target, READ_OPTS, this[kLookup](path));
        return void this[kEmit]('change', parsed);
      });
    };
  }

  watch(path) {
    const { deep, ignore } = this[kOptions];
    const watchers = this[kWatchers];
    if (watchers.has(path) || !access(ignore, path)) return this;
    stat(path, (err, stats) => {
      if (err || watchers.has(path)) return;
      watchers.set(path, watch(path, this[kListener](path)));
      stats.isDirectory() && deep && readdir(path, READ_OPTS, this[kLookup](path));
    });
    return this;
  }

  close() {
    this.clear().removeAllListeners();
    return this;
  }

  clear() {
    const watchers = this[kWatchers];
    watchers.forEach(watcher => void watcher.close());
    return watchers.clear(), this;
  }

  unwatch(path) {
    const watchers = this[kWatchers];
    watchers.get(path)?.close(), watchers.delete(path);
    return this;
  }
};
