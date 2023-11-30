'use strict';

const TIMEOUT = 1_000;

const access = (list, v) => {
  let [flag, i] = [true, 0];
  for (; flag && i < list.length; flag = !new RegExp(list[i]).test(v), ++i);
  return flag;
};

const scheduler = (timeout = TIMEOUT, emit) => {
  var timer = null;
  const queue = new Map();
  const sendQueue = () => {
    if (!timer) return;
    timer = (clearTimeout(timer), null);
    const packet = [...queue.entries()];
    queue.clear();
    emit('before', packet);
    for (var [path, event] of packet) emit(event, path);
    emit('after', packet);
  };

  return (event, path) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(sendQueue, timeout);
    queue.set(path, event);
  };
};

module.exports = { access, scheduler };
