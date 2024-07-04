'use strict';

const IS_NOT_ACTIVE = 'Scheduler is not active';
const DEFAULT_TIMEOUT = 1_000;

module.exports = class Scheduler {
  #timeout = DEFAULT_TIMEOUT;
  #queue = new Map();
  #active = true;
  #timer = null;
  #call;

  constructor(callback, timeout) {
    if (typeof timeout === 'number') this.#timeout = timeout;
    this.#call = callback;
  }

  #send() {
    if (!this.#timer) return;
    this.#timer = clearTimeout(this.#timer) ?? null;
    const packet = [...this.#queue.entries()];
    this.#queue.clear();
    this.#call('before', packet);
    packet.forEach(({ 0: path, 1: event }) => this.#call(event, path));
    this.#call('after', packet);
  }

  add(event, path) {
    if (!this.#active) throw new Error(IS_NOT_ACTIVE);
    this.#timer && clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#send(), this.#timeout);
    this.#queue.set(path, event);
  }

  isActive() {
    return this.#active;
  }

  open() {
    this.#active = true;
  }

  close() {
    this.#send();
    this.#active = false;
  }
};
