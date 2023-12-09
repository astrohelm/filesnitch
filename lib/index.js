'use strict';

const TIMEOUT = 1_000;
const access = (list, v) => !list.some(ignore => new RegExp(ignore).test(v));
const scheduler = (watcher, timeout = TIMEOUT) => {
  var timer = null;
  const queue = new Map();
  const sendQueue = () => {
    if (!timer) return;
    timer = (clearTimeout(timer), null);
    const packet = [...queue.entries()];
    queue.clear();
    watcher.emit('before', packet);
    packet.forEach(({ 0: path, 1: event }) => watcher.emit(event, path));
    watcher.emit('after', packet);
  };

  return (event, path) => {
    timer && clearTimeout(timer);
    timer = setTimeout(sendQueue, timeout);
    queue.set(path, event);
  };
};

module.exports = { access, scheduler };
