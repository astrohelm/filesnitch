'use strict';

const TIMEOUT = 200;

const access = (ignore, path) =>
  ignore.reduce((acc, cur) => acc & !new RegExp(cur).test(path), true);

const schedular = (timeout = TIMEOUT, emit) => {
  let timer = null;
  const queue = new Map();

  const sendQueue = () => {
    if (!timer) return;
    timer = (clearTimeout(timer), null);
    const packet = [...queue.entries()];
    console.log(packet);
    queue.clear();
    emit('before', packet);
    for (const [path, event] of packet) emit(event, path);
    emit('after', packet);
  };

  return (event, path) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(sendQueue, timeout);
    queue.set(path, event);
  };
};

module.exports = { access, schedular };
