<h1 align="center">FileSnitch - File system watcher</h1>

<p align="center">
 Watch specific files, directories, deeply nested directories <br/>
 Rebuild recursive when new directories found or old directories remove <br/>
 Deduplicate events with debounce <br/>
</p>

> [!WARNING]
>
> Macos can emit directory events if nested files were removed / added. This behavior can be
> different on each OS. As for Linux ecosystem, in most distributions - we missing this behavior.

<h2 align="center">Installation</h2>

```bash
npm i leadwatch --save
```

<h2 align="center">Usage</h2>

```js
const Snitch = require('filesnitch');
const snitch = new Snitch({
  timeout: 200, // Events debouncing for queue
  ignore: [new RegExp(/[\D\d]+\.ignore\D*/)], // Ignore files and directories
  deep: false, // Include nested directories
  home: process.cwd(), // Removes root path from emits, Warning: ignore will work on full paths
});

snitch.watch('/home/user/Downloads').watch('/home/user/Documents');
snitch.on('before', updates => console.log({ before: updates }));
snitch.on('change', path => console.log({ changed: path }));
snitch.on('unlink', path => console.log({ deleted: path }));
snitch.on('after', updates => console.log({ after: updates }));
```

<h2 align="center">Copyright & contributors</h2>

<p align="center">
Copyright © 2023 <a href="https://github.com/astrohelm/filesnitch/graphs/contributors">Astrohelm contributors</a>.
This library <a href="./LICENSE">MIT licensed</a>.<br/>
And it is part of <a href="https://github.com/astrohelm">Astrohelm ecosystem</a>.
</p>
