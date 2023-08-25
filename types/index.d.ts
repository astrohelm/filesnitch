import { EventEmitter } from 'events';
import { FSWatcher } from 'fs';

type Options = {
  timeout?: number; //* Debounce timeout in milliseconds
  deep?: boolean; //* If true, will watch files recursively
  ignore?: RegExp[]; //* Ignore specific file patterns
  home?: string; //* Root directory (process.cwd)
};

/**
 * Watch specific files, directories, deeply nested directories.
 *
 * Rebuild recursive when new directories found or old directories remove.

* Deduplicate events with debounce.

* @example <caption>Example of Usage</caption>
 * const DirectoryWatcher = require('astrowatch');
 * const watcher = new DirectoryWatcher({
 *   timeout: 200, // Events debouncing for queue
 *   ignore: [new RegExp(/[\D\d]+\.ignore\.[\D\d]+/)], // Ignore files and directories
 *   deep: false, // Include nested directories
 *   home: process.cwd(), // Removes root path from emits, Warning: ignore will work on full paths
 * });
 * watcher.watch('/home/sashapop10/Downloads');
 * watcher.watch('/home/sashapop10/Documents');
 * watcher.on('before', updates => console.log({ before: updates }));
 * watcher.on('change', path => console.log({ changed: path }));
 * watcher.on('delete', path => console.log({ deleted: path }));
 * watcher.on('after', updates => console.log({ after: updates }));
 * // Some where later
 * // watcher.close(); Or just watcher.clear() to remove all watching files
 */
export default class Watcher extends EventEmitter {
  constructor(options?: Options);
  watch(path: string): void;
  unwatch(path: string): void;
  clear(): void;
  close(): void;
}
