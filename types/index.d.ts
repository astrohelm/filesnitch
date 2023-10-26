import { EventEmitter } from 'events';

type Options = {
  timeout?: number; //* Debounce timeout in milliseconds
  deep?: boolean; //* If true, will watch files recursively
  ignore?: RegExp[]; //* Ignore specific file patterns
  home?: string; //* Root directory (process.cwd)
};

type Events = 'before' | 'after' | 'change' | 'delete';

/**
 * @description
 * Watch specific files, directories, deeply nested directories.
 *
 * Rebuild recursive when new directories found or old directories remove.
 *
 * Deduplicate events with debounce.
 * @example <caption>Example of Usage</caption>
 * const Snitch = require('filesnitch');
 * const snitch = new Snitch({
 *   timeout: 200, // Events debouncing for queue
 *   ignore: [new RegExp(/[\D\d]+\.ignore\.[\D\d]+/)], // Ignore files and directories
 *   deep: false, // Include nested directories
 *   home: process.cwd(), // Removes root path from emits, Warning: ignore will work on full paths
 * });
 * snitch
 *   .watch('/home/sashapop10/Downloads')
 *   .watch('/home/sashapop10/Documents')
 *   .on('before', updates => console.log({ before: updates }))
 *   .on('change', path => console.log({ changed: path }))
 *   .on('delete', path => console.log({ deleted: path }))
 *   .on('after', updates => console.log({ after: updates }));
 */
export = class Watcher extends EventEmitter {
  constructor(options?: Options);
  /**
   * @description Add listeners
   * @example <caption>Possible events - change, delete, before, after</caption>
   * const snitch = new Snitch();
   * snitch.watch('./tests');
   * snitch.on('before', package => console.log(package)); // STDOUT: [['/tests', 'change']]
   * snitch.on('change', package => console.log(package)); // STDOUT: '/tests'
   * snitch.on('after', package => console.log(package)); //  STDOUT:[['/tests', 'change']]
   */
  on(event: Events, handler: (...args: any[]) => void): EventEmitter;
  /**
   * @description Observe new path
   * @example <caption>Allow you to watch file and directories</caption>
   * const snitch = new Snitch();
   * snitch.watch('./tests');
   * snitch.watch('./somefile.js');
   */
  watch(path: string): Watcher;
  /**
   * @description Remove route from observation
   * @example <caption>Useful when you need to watch only a period of time</caption>
   * const snitch = new Snitch();
   * snitch.watch('./tests');
   * snitch.on('change', path => console.log(path));
   * setTimeout(() => {
   *    snitch.unwatch('./tests');
   * }, 1000);
   */
  unwatch(path: string): Watcher;
  /**
   * @description Removes all watchers
   * @example <caption>Useful when you need to restart app</caption>
   * const snitch = new Snitch();
   * snitch.watch('./tests');
   * snitch.on('change', path => console.log(path));
   * snitch.clear();
   * snitch.emit('change', 'Hello World!'); // STDOUT: Hello World !
   */
  clear(): Watcher;
  /**
   * @description Removes all listeners and paths watchers
   * @example <caption>Useful when you need to restart app</caption>
   * const snitch = new Snitch();
   * snitch.watch('./tests');
   * snitch.on('change', path => console.log(path));
   * snitch.close();
   * snitch.emit('change', 'Hello World!'); // No stdout
   */
  close(): Watcher;
};
