'use strict';

const { stat, readdir, watch } = require('node:fs');
const { EventEmitter } = require('node:events');
const { access, scheduler } = require('./lib');
const { join, sep } = require('node:path');
const READ_OPTS = { withFileTypes: true };

module.exports.default = module.exports = class Watcher extends EventEmitter {
  static watch = (path, options) => new Watcher(options).watch(path);
  #watchers = new Map();
  #schedule = null;
  #options = null;

  constructor(options = {}) {
    super();
    this.#schedule = scheduler(this, options.timeout);
    this.#options = { ...options, ignore: options.ignore ?? [] };
  }

  watch(path) {
    const { deep, ignore } = this.#options;
    const watchers = this.#watchers;
    if (watchers.has(path) || !access(ignore, path)) return this;
    stat(path, (err, stats) => {
      if (err || watchers.has(path)) return;
      watchers.set(path, watch(path, this.#listener(path)));
      stats.isDirectory() && deep && readdir(path, READ_OPTS, this.#lookup(path));
    });
    return this;
  }

  close() {
    this.clear().removeAllListeners();
    return this;
  }

  clear() {
    const watchers = this.#watchers;
    watchers.forEach(watcher => void watcher.close());
    return watchers.clear(), this;
  }

  unwatch(path) {
    const watchers = this.#watchers;
    watchers.get(path)?.close();
    watchers.delete(path);
    return this;
  }

  #lookup(path) {
    const lookup = f => void (f.isDirectory() && this.watch(join(path, f.name)));
    return (err, files) => void (!err && files.forEach(lookup));
  }

  #listener(path) {
    const { home, deep, ignore } = this.#options;
    return (_, filename) => {
      const target = path.endsWith(sep + filename) ? path : join(path, filename);
      if (!access(ignore, target)) return;
      stat(target, (err, stats) => {
        const parsed = home ? target.replace(home, '') : target;
        if (err) return void (this.unwatch(target), this.#schedule('unlink', parsed));
        stats.isDirectory() && deep && readdir(target, READ_OPTS, this.#listener(path));
        return void this.#schedule('change', parsed);
      });
    };
  }
};
