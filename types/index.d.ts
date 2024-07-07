import { EventEmitter } from 'events';
import { Stats } from 'fs';

type Options = {
  timeout?: number; //* Debounce timeout in milliseconds
  recursive?: boolean; //* If true, will watch files recursively
  filter?: RegExp | string | ((path: string) => boolean); //* Ignore specific file patterns
  home?: string; //* Root directory (process.cwd)
};

type Events = 'before' | 'after' | 'update' | 'unlink' | 'new' | 'ready' | 'close' | 'error';
type CallBack = (event: Events, path: string, details: Stats | null) => void;

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
 *   filter: path => !path.includes('ignore'), // Ignore files and directories
 *   recursive: false, // Include nested directories
 *   home: process.cwd(), // Removes root path from emits, Warning: ignore will work on full paths
 * });
 * snitch
 *   .watchSync('/home/sashapop10/Downloads')
 *   .watchSync('/home/sashapop10/Documents')
 *   .on('before', updates => console.log({ before: updates }))
 *   .on('new', path => console.log({ new: path }))
 *   .on('update', path => console.log({ updated: path }))
 *   .on('unlink', path => console.log({ deleted: path }))
 *   .on('after', updates => console.log({ after: updates }));
 */
export = class FSnitch extends EventEmitter {
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
   * @example <caption>Allow you to watch file and directories, with ASYNC start</caption>
   * Snitch.watch('./tests').catch(() => console.log('Trouble with watcher opening'));
   */
  static async watch(path: string, options?: Options, cb: CallBack): Promise<Watcher>;
  /**
   * @example <caption>Allow you to watch file and directories, with SYNC start</caption>
   * Snitch.watchSync('./tests').watchSync('./somefile.js');
   */
  static watchSync(path: string, options?: Options, cb: CallBack): Watcher;
  /**
   * @example <caption>Allow you to watch file and directories, with SYNC start</caption>
   * const snitch = new Snitch();
   * try {
   *   snitch.watchSync('./tests');
   *   snitch.watchSync('./somefile.js');
   *   console.log('OK')
   * } catch {
   *   console.log('Trouble with watcher opening')
   * }
   */
  watchSync(path: string, cb: CallBack): Watcher;
  /**
   * @example <caption>Allow you to watch file and directories, with ASYNC start</caption>
   * const snitch = new Snitch();
   * snitch.watch('./tests').catch(() => console.log('Trouble with watcher opening'));
   * snitch.watch('./somefile.js').then(() => console.log('OK'));
   */
  async watch(path: string, cb: CallBack): Promise<Watcher>;
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
   * @description Removes all watchers and flushes all events
   * @example <caption>Useful when you need to restart app</caption>
   * const snitch = new Snitch();
   * snitch.close();
   */
  close(): Watcher;
  /**
   * @description Reactivates snitch
   * @example <caption>Useful when you need to restart app</caption>
   * const snitch = new Snitch();
   * snitch.close();
   * snitch.open();
   */
  open(): Watcher;
  /**
   * @description Snitch status
   * const snitch = new Snitch();
   * snitch.isActive(); // true
   * snitch.close();
   * snitch.isActive(); // false
   * snitch.open();
   * snitch.isActive(); // true
   */
  isActive(): boolean;
  /**
   * @description Predicts path availability
   * const snitch = new Snitch({ filter: /[a-zA-Z]\.ext/ });
   * snitch.predict('Hello.ext'); // true
   * snitch.predict('Hello.png'); // false
   */
  predict(): boolean;
  /**
   * @description Flushed all collected events without any waiting
   */
  flush(): void;
  _schedule(event: Events);
  /**
   * @description Hold application from off when any Watcher added. Default state is refed;
   */
  ref(): Watcher;
  /**
   * @description Does not hold application from off when any Watcher added. Default state is refed;
   */
  unref(): Watcher;
  /**
   * @description Array of paths being watched
   */
  observed: string[];
};
