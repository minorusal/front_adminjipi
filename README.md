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
