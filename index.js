'use strict';

const { STATS_OPTS, WATCH_OPTS, REC_WATCH_OPTS, EVENTS, createFilter } = require('./lib/utilities');
const { ERR_ACCESS_DENIED, ERR_DUPLICATE, ERR_CAN_NOT_OPEN } = require('./lib/utilities');
const { existsSync, promises: fsp, watch } = require('node:fs');
const { ERR_UNSUPPORTED } = require('./lib/utilities');
const { join, sep } = require('node:path');

module.exports = class FSnitch extends require('./lib/scheduler') {
  static watchSync = (path, options, cb) => new FSnitch(options).watchSync(path, cb);
  static watch = async (path, options, cb) => new FSnitch(options).watch(path, cb);
  static EVENTS = EVENTS;
  #watchers = new Map();
  #home = process.cwd();
  #recursive = true;
  predict;

  constructor(options = {}) {
    super(options?.timeout);
    if (typeof options !== 'object') throw new TypeError(`${ERR_UNSUPPORTED} 'options'`);
    if (typeof recursive === 'boolean') this.#recursive = options.recursive;
    if (typeof home === 'string') this.#home = options.home;
    this.predict = createFilter(options.filter);
  }

  watchSync(path, cb) {
    if (cb && typeof cb !== 'function') throw new TypeError(`${ERR_UNSUPPORTED} 'callback'`);
    if (typeof path !== 'string') throw new TypeError(`${ERR_UNSUPPORTED} 'path'`);
    if (this.#watchers.has(path)) throw new Error(ERR_DUPLICATE);
    if (!this.predict(path)) throw new Error(`${ERR_ACCESS_DENIED}: ${path}`);
    if (!existsSync(path)) throw new Error(`${ERR_CAN_NOT_OPEN}: ${path}`);
    const options = this.#recursive ? REC_WATCH_OPTS : WATCH_OPTS;
    const watcher = watch(path, options, this.#listener.bind(this, path, cb));
    this.#watchers.set(path, watcher);
    return this;
  }

  async watch(path, cb) {
    if (cb && typeof cb !== 'function') throw new TypeError(`${ERR_UNSUPPORTED} 'callback'`);
    if (typeof path !== 'string') throw new TypeError(`${ERR_UNSUPPORTED} 'path'`);
    if (!this.predict(path)) throw new Error(`${ERR_ACCESS_DENIED}: ${path}`);
    const stats = await fsp.stat(path).catch(() => null);
    if (stats === null) throw new Error(`${ERR_CAN_NOT_OPEN}: ${path}`);
    if (this.#watchers.has(path)) throw new Error(ERR_DUPLICATE);
    const options = this.#recursive ? REC_WATCH_OPTS : WATCH_OPTS;
    const watcher = watch(path, options, this.#listener.bind(this, path, cb));
    this.#watchers.set(path, watcher);
    return this;
  }

  async #listener(path, cb, _, filename) {
    const target = path.endsWith(sep + filename) ? path : join(path, filename);
    const parsed = this.#home ? target.replace(this.#home, '') : target;
    if (!this.predict(target)) return;

    const stats = await fsp.stat(target, STATS_OPTS).catch(() => null);
    var event = EVENTS.UPDATE;

    if (!stats) {
      const watcher = this.#watchers.get(target);
      if (watcher) watcher.close(), this.#watchers.delete(target);
      this._schedule(EVENTS.UNLINK, parsed, null);
      cb && cb(event, parsed, null);
      return;
    }

    const { birthtimeMs: bornAt, mtimeMs: modAt, ctimeMs: changedAt } = stats;
    if (bornAt === changedAt && bornAt === modAt) event = EVENTS.NEW;
    this._schedule(event, parsed, stats);
    cb && cb(event, parsed, stats);
  }

  get observed() {
    return [...this.#watchers.keys()];
  }

  unwatch(path) {
    if (typeof path !== 'string') throw new TypeError(`${ERR_UNSUPPORTED} 'path'`);
    const watcher = this.#watchers.get(path);
    if (!watcher) return false;
    this.#watchers.delete(path);
    watcher.close();
    return true;
  }

  ref() {
    for (var watcher of this.#watchers) watcher.ref();
    return this;
  }

  unref() {
    for (var watcher of this.#watchers) watcher.unref();
    return this;
  }

  close() {
    super.close();
    this.clear();
    return this;
  }

  clear() {
    for (var watcher of this.#watchers.values()) watcher.close();
    this.#watchers.clear();
    return this;
  }
};
