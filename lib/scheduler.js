'use strict';

module.exports = Scheduler;

const DEFAULT_TIMEOUT = 1_000;
function Scheduler(emit, timeout = DEFAULT_TIMEOUT) {
  this.timer = null;
  this.queue = new Map();
  this.emit = emit;
  this.timeout = timeout;
  this.send = this.send.bind(this);
  return this.add.bind(this);
}

Scheduler.prototype.add = function (event, path) {
  this.timer && clearTimeout(this.timer);
  this.timer = setTimeout(this.send, this.timeout);
  this.queue.set(path, event);
};

Scheduler.prototype.send = function () {
  if (!this.timer) return;
  this.timer = (clearTimeout(this.timer), null);
  const packet = [...this.queue.entries()];
  this.queue.clear();
  this.emit('before', packet);
  packet.forEach(({ 0: path, 1: event }) => this.emit(event, path));
  this.emit('after', packet);
};
