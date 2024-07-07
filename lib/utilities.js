'use strict';

exports.EVENTS = {
  NEW: 'new',
  UNLINK: 'unlink',
  UPDATE: 'update',

  BEFORE_DROP: 'before',
  AFTER_DROP: 'after',

  EVENT: 'event',
  READY: 'ready',
  CLOSE: 'close',
  ERROR: 'error',
};

exports.REC_WATCH_OPTS = { recursive: true, encoding: 'utf8', persistent: true };
exports.WATCH_OPTS = { recursive: false, encoding: 'utf8', persistent: true };
exports.READ_OPTS = { withFileTypes: true };
exports.STATS_OPTS = { bigint: true };
exports.BOUNCE_INTERVAL = 1_000;

exports.ERR_NOT_ACTIVE = 'FS Activity in inactive state';
exports.ERR_DUPLICATE = 'Attempt to duplicate watcher';
exports.ERR_CAN_NOT_OPEN = 'Failed to start watching: ';
exports.ERR_ACCESS_DENIED = 'Access denied: ';

exports.createFilter = filter => {
  if (filter instanceof RegExp) return f => filter.test(f);
  if (typeof filter === 'function') return filter;
  if (typeof filter === 'string') {
    var re = new RegExp(filter);
    return f => re.test(f);
  }

  return () => true;
};
