'use strict';

const { EVENTS, ERR_NOT_ACTIVE, BOUNCE_INTERVAL } = require('./utilities');
module.exports = class Scheduler extends require('node:events').EventEmitter {
  #timeout = BOUNCE_INTERVAL;
  #queue = new Map();
  #active = true;
  #timer = null;

  constructor(timeout) {
    super();
    if (typeof timeout === 'number') this.#timeout = timeout;
    setImmediate(() => void this.emit(EVENTS.READY));
  }

  flush() {
    if (!this.#timer) return;
    this.#timer = clearTimeout(this.#timer) ?? null;
    const packet = [...this.#queue.entries()];
    this.#queue.clear();
    this.emit(EVENTS.BEFORE_DROP, packet);
    packet.forEach(({ 0: path, 1: [event, details] }) => {
      this.emit(EVENTS.EVENT, path, event, details);
      this.emit(event, path, details);
    });
    this.emit(EVENTS.AFTER_DROP, packet);
  }

  _schedule(event, path, details) {
    if (!this.#active) {
      this.emit(EVENTS.ERROR, `${ERR_NOT_ACTIVE}: ${event} at ${path}`);
      return;
    }

    this.#timer && clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.flush(), this.#timeout);

    const previous = this.#queue.get(path);
    if (!previous) return void this.#queue.set(path, [event, details]);
    if (previous[0] !== EVENTS.NEW || event === EVENTS.UNLINK) previous[0] = event;
    previous[1] = details;
  }

  isActive() {
    return this.#active;
  }

  open() {
    if (this.#active) return this;
    this.#active = true;
    this.emit(EVENTS.READY);
    return this;
  }

  close() {
    if (!this.#active) return this;
    this.#active = false;
    this.flush();
    this.emit(EVENTS.CLOSE);
    return this;
  }
};
