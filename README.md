<h1 align="center">FileSnitch - File system watcher</h1>

<p align="center">
 Watch specific files, directories and deeply nested directories <br/>
 Deduplicate events with debounce <br/>
 Filter your filesystem events <br/>
</p>

> [!WARNING]
>
> This library does not manage rename event, you will receive two different events instead:
>
> - First event is `unlink`, with old path to the file
> - Second event is `new`, with new path to the file
>
> You can handle it on your own with handling this kind of scenarios. Also don't use this library if
> you want to manage remote repositories, try `fs.watchFile` instead.

<h2 align="center">Installation</h2>

```bash
npm i filesnitch --save
```

<h2 align="center">Usage</h2>

```js
const Snitch = require('filesnitch');
const snitch = new Snitch({
  timeout: 200, // Events debouncing for queue (default 1000)
  filter: new RegExp(/[\D\d]+\.ignore\D*/), // Ignore files and directories
  // filter: path => new RegExp(/[\D\d]+\.ignore\D*/).test(path), // (Function)
  // filter: /[\D\d]+\.ignore\D*/, // (RegExp)
  // filter: '/[\D\d]+\.ignore\D*/', // (string)
  recursive: false, // Include nested directories (default: true)
  home: process.cwd(), // Removes root path from emits, Warning: ignore will work on full paths
});

snitch.watchSync('/home/user/Downloads').watchSync('/home/user/Documents');
snitch.watch('/home/user/Desktop', (event, path, details) => console.log('New File ! Desktop'));
snitch.on('before', events => console.log({ before: events }));
snitch.on('update', (path, details) => console.log({ changed: path, details }));
snitch.on('unlink', path => console.log({ deleted: path }));
snitch.on('new', path => console.log({ new: path }));
snitch.on('event', (event, path, details) => console.log({ event, path, details }));
snitch.on('after', events => console.log({ after: events }));
```

<h2 align="center">Copyright & contributors</h2>

<p align="center">
Copyright © 2023 <a href="https://github.com/astrohelm/filesnitch/graphs/contributors">Astrohelm contributors</a>.
This library <a href="./LICENSE">MIT licensed</a>.<br/>
And it is part of <a href="https://github.com/astrohelm">Astrohelm ecosystem</a>.
</p>
