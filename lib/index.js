'use strict';

const TIMEOUT = 1_000;

const access = (list, v) => {
  for (var flag = true, i = 0; flag && i < list.length; flag = !new RegExp(list[i]).test(v), ++i);
  return flag;
};

const scheduler = (emit, timeout = TIMEOUT) => {
  var timer = null;
  const queue = new Map();
  const sendQueue = () => {
    if (!timer) return;
    timer = (clearTimeout(timer), null);
    const packet = [...queue.entries()];
    queue.clear();
    emit('before', packet);
    packet.forEach(({ 0: path, 1: event }) => emit(event, path));
    emit('after', packet);
  };

  return (event, path) => {
    timer && clearTimeout(timer);
    timer = setTimeout(sendQueue, timeout);
    queue.set(path, event);
  };
};

module.exports = { access, scheduler };
