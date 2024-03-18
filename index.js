'use strict';

const { Scheduler, access, setWatcher } = require('./lib');
const { EventEmitter } = require('node:events');
const { stat } = require('node:fs');

module.exports.default = module.exports = class Watcher extends EventEmitter {
  static watch = (path, options) => new Watcher(options).watch(path);
  #watchers = new Map();

  constructor(options = {}) {
    super();
    this.emit = new Scheduler(this.emit.bind(this), options.timeout);
    this.options = { ...options, ignore: options.ignore ?? [] };
  }

  watch(path) {
    if (this.#watchers.has(path) || !access(this.options.ignore, path)) return this;
    return stat(path, setWatcher.bind(this, path, this.#watchers)), this;
  }

  close() {
    return this.clear().removeAllListeners();
  }

  clear() {
    this.#watchers.forEach(watcher => void watcher.close());
    return this.#watchers.clear(), this;
  }

  unwatch(path) {
    this.#watchers.get(path)?.close();
    this.#watchers.delete(path);
    return this;
  }
};
