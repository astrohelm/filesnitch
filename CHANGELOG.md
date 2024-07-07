# Changelog

## [Unreleased][unreleased]

## [2.0.0][] - 2024-07-07

### Major update

- Switch from ignore list to filter function.
- Restartable scheduler, allows to flush events in sync way before finish.
- New scheduler events: ready, close, event, unlink, update, new.
- New event parameter: details, available with update and new events.
- New synchronous methods for snitch: flush, watchSync, open, close, \_schedule, ref, unref.
- Callbacks for watch methods.
- Drop support of NodeJS < 22.
- Documentation enhancement.
- Packages update.

## [1.8.1][] - 2024-03-19

- Eslint bug fix
- Pull request template update
- Readme warning update
- Version fix

## [1.8.0][] - 2024-03-18

- Return of macos & windows CI versions
- Code quality improvements
- Removed private fields -> decomposition to utils
- Updated packages
- Scheduler as self-entity -> can be removed by astropack scheduler in the future
- Fixed bug with nested updates

## [1.7.0][] - 2024-01-14

- Removed symbolic properties
- Packages update
- Grammar fixes

## [1.6.0][] - 2023-12-10

- Code quality improvements
- Static method watch (fp friendly)
- Delete event renamed to unlink
- More control over watcher with symbols
- Rewritten to class syntax
- Updated packages

## [1.5.0][] - 2023-12-07

- Code performance improvements
- Symbolic keywords for isolation

## [1.4.0][] - 2023-12-05

- Code quality improvements
- Version bug fix
- CI only for ubuntu

## [1.3.0][] - 2023-12-01

- Code quality improvements
- Packages update
- Library exports now support ESM & typescript

## [1.2.0][] - 2023-10-28

- Prevent unexpected behavior

## [1.1.0][] - 2023-10-26

- Methods chaining
- Quality improvements
- Performance improvements
- JSDOC Enhancements
- Readme updates
- CI only for 18
- Support latest:21 node version
- Renamed filesnitch -> filesnitch

## [1.0.0][] - 2023-08-25

- Moved from Leadfisher
- New <code>.close</code> and <code>.clear</code> methods
  - Both in use for memory safety
- New option <code>home</code>
  - Added for long path replacements
- New Tests
- JSDoc

[unreleased]: https://github.com/astrohelm/filesnitch/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/astrohelm/filesnitch/compare/v1.8.1...v2.0.0
[1.8.1]: https://github.com/astrohelm/filesnitch/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/astrohelm/filesnitch/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/astrohelm/filesnitch/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/astrohelm/filesnitch/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/astrohelm/filesnitch/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/astrohelm/filesnitch/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/astrohelm/filesnitch/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/astrohelm/filesnitch/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/astrohelm/filesnitch/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/astrohelm/filesnitch/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/astrohelm/filesnitch/releases/tag/v1.0.0
