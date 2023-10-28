'use strict';

const READ_OPTS = { withFileTypes: true };
const [fs, { join, sep }] = [require('node:fs'), require('node:path')];
const { access: accessible, scheduler } = require('./lib');
const { EventEmitter } = require('node:events');

module.exports = function Watcher(options = {}) {
  const { timeout, ignore = [], home, deep } = options;
  const [watchers, bridge] = [new Map(), new EventEmitter()];
  const emit = scheduler(timeout, bridge.emit.bind(bridge));
  const access = accessible.bind(null, [...ignore]);

  const lookup = path => (err, files) =>
    void (!err && files.forEach(f => f.isDirectory() && bridge.watch(join(path, f.name))));

  const listener = path => (_, filename) => {
    const target = path.endsWith(sep + filename) ? path : join(path, filename);
    if (!access(target)) return;
    fs.stat(target, (err, stats) => {
      const parsed = home ? target.replace(home, '') : target;
      if (err) return void (bridge.unwatch(target), emit('delete', parsed));
      stats.isDirectory() && deep && fs.readdir(target, READ_OPTS, lookup(path));
      return void emit('change', parsed);
    });
  };

  bridge.close = () => (bridge.clear(), bridge.removeAllListeners(), bridge);
  bridge.clear = () => (watchers.forEach(watcher => watcher.close()), watchers.clear(), bridge);
  bridge.unwatch = path => (watchers.get(path)?.close(), watchers.delete(path), bridge);
  bridge.watch = path => {
    if (watchers.has(path) || !access(path)) return bridge;
    fs.stat(path, (err, stats) => {
      if (err || watchers.has(path)) return;
      watchers.set(path, fs.watch(path, listener(path)));
      stats.isDirectory() && deep && fs.readdir(path, READ_OPTS, lookup(path));
    });
    return bridge;
  };
  return bridge;
};
