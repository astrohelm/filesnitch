<h1 align="center">Astrowatch - File system watcher</h1>

<p align="center">
 Watch specific files, directories, deeply nested directories <br/>
 Rebuild recursive when new directories found or old directories remove <br/>
 Deduplicate events with debounce <br/>
</p>

<h2 align="center">Installation</h2>

```bash
npm i leadwatch --save
```

<h2 align="center">Usage</h2>

```js
const DirectoryWatcher = require('astrowatch');
const watcher = new DirectoryWatcher({
  timeout: 200, // Events debouncing for queue
  ignore: [new RegExp(/[\D\d]+\.ignore\D*/)], // Ignore files and directories
  deep: false, // Include nested directories
  home: process.cwd(), // Removes root path from emits, Warning: ignore will work on full paths
});
watcher.watch('/home/sashapop10/Downloads');
watcher.watch('/home/sashapop10/Documents');
watcher.on('before', updates => console.log({ before: updates }));
watcher.on('change', path => console.log({ changed: path }));
watcher.on('delete', path => console.log({ deleted: path }));
watcher.on('after', updates => console.log({ after: updates }));
```

<h2 align="center">Copyright & contributors</h2>

<p align="center">
Copyright © 2023 <a href="https://github.com/astrohelm/astrowatch/graphs/contributors">Astrohelm contributors</a>.
Astrowatch is <a href="./LICENSE">MIT licensed</a>.<br/>
Astrowatch is part of <a href="https://github.com/astrohelm">Astrohelm ecosystem</a>.
</p>
