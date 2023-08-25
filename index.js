'use strict';

const fs = require('node:fs');
const { join, sep } = require('node:path');
const { access: accessible, schedular } = require('./lib');
const { EventEmitter } = require('node:events');

module.exports = function (options) {
  const [watchers, bridge] = [new Map(), new EventEmitter()];
  const emit = schedular(options?.timeout, bridge.emit.bind(bridge));
  const access = accessible.bind(null, options?.ignore ?? []);
  const watch = (path, f) => access(f.name) && f.isDirectory() && bridge.watch(join(path, f.name));
  const watchFiles = (path, files, handler = watch.bind(null, path)) => files.forEach(handler);

  const setWatcher = path => {
    if (watchers.has(path)) return;
    const watcher = fs.watch(path, (_, filename) => {
      const target = path.endsWith(sep + filename) ? path : join(path, filename);
      if (!access(target)) return;
      fs.stat(target, (err, stats) => {
        const parsed = options?.home ? target.replace(options.home, '') : target;
        if (err) return void (bridge.unwatch(target), emit('delete', parsed));
        stats.isDirectory() && options?.deep && bridge.watch(target), emit('change', parsed);
        return void 0;
      });
    });
    watchers.set(path, watcher);
  };

  bridge.close = () => void (bridge.clear(), bridge.removeAllListeners());
  bridge.clear = () => void (watchers.forEach(watcher => watcher.close()), watchers.clear());
  bridge.unwatch = path => void (watchers.get(path)?.close(), watchers.delete(path));
  bridge.watch = path => {
    if (watchers.has(path)) return;
    fs.stat(path, (err, stats) => {
      if (err) return;
      setWatcher(path);
      if (!stats.isDirectory() || !options?.deep) return;
      fs.readdir(path, { withFileTypes: true }, (err, files) => !err && watchFiles(path, files));
    });
  };

  return bridge;
};
