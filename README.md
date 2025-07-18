# New Project

This repository has been cleaned to serve as the starting point for a new project. Feel free to add your own files and configurations.

## Features

- **Auth Module**: lazy loaded via `appRoutes` with preloading enabled.
  - `AuthShellPage` provides an internal `<router-outlet>` for child routes.

## Development Requirements

This project targets Angular 15 and can be built using **Node.js 16.13.2**.
Newer versions of Angular CLI rely on Node 18 features such as
`os.availableParallelism()`. Pinning the Angular packages to v15 allows the
project to run with Node 16.

When installing dependencies run `npm install` from the project root. If npm
reports a peer dependency conflict related to `@angular-devkit/build-angular`,
remove any globally installed Angular CLI packages and retry with
`npm install --legacy-peer-deps`.

## Socket tests

Run `npm test` to execute a lightweight test suite for the `SocketService`.
The tests use stubbed versions of Angular and Socket.IO so they work even
without installing the full dependency tree.

The `SocketService` now logs a message when the connection succeeds and prints
any socket connection errors to the console. This helps diagnose networking
issues during development.

## Notifications overview

The frontend reads `mcId` and `compId` from the `sessionToken` JWT stored in
`localStorage`. No cookies are required. Socket events used by the application
are:

- `notification:list`
- `notification:new`
- `notification:badge`
- `notification:seen:ack`
- `notification:deleted`
