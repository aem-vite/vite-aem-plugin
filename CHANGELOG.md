# [3.0.0](https://github.com/aem-vite/vite-aem-plugin/compare/v2.3.3...v3.0.0) (2023-04-30)


### Bug Fixes

* allow server open behaviour to be disabled ([e5b278a](https://github.com/aem-vite/vite-aem-plugin/commit/e5b278a98a38c58ce36e8c28fd9ba372222fe82e))


### Build System

* update npm deps and node engine ([2e67c8c](https://github.com/aem-vite/vite-aem-plugin/commit/2e67c8c385330d5e68215a965af31866e921cc8d))


### Features

* ability to define custom AEM path segments ([e378c58](https://github.com/aem-vite/vite-aem-plugin/commit/e378c58501864e209d0ccb709fbd375df048a1c2))


### BREAKING CHANGES

* minimum version of node/vite

Node.js v14.18.0 and Vite 3.0.0 or greater are now required.

## [2.3.3](https://github.com/aem-vite/vite-aem-plugin/compare/v2.3.2...v2.3.3) (2023-03-13)


### Bug Fixes

* **dep:** remove zlib dependency for node.js lib ([35e7784](https://github.com/aem-vite/vite-aem-plugin/commit/35e7784cdf120ddc14b4582fa1b8d6221349f7de))

## [2.3.2](https://github.com/aem-vite/vite-aem-plugin/compare/v2.3.1...v2.3.2) (2022-11-30)


### Bug Fixes

* mark `@vitejs/plugin-react` as an optional peer dep ([6db341d](https://github.com/aem-vite/vite-aem-plugin/commit/6db341d06a9d697c50864a03f9377ddd4103ecff))

## [2.3.1](https://github.com/aem-vite/vite-aem-plugin/compare/v2.3.0...v2.3.1) (2022-11-14)


### Bug Fixes

* add missing proxy path for /login ([9aa57ba](https://github.com/aem-vite/vite-aem-plugin/commit/9aa57bac8cd927614e3f7597f8b994efd3bf83f2))

# [2.3.0](https://github.com/aem-vite/vite-aem-plugin/compare/v2.2.1...v2.3.0) (2022-11-13)


### Bug Fixes

* correct position of devserver scripts in proxy ([41f5782](https://github.com/aem-vite/vite-aem-plugin/commit/41f57826e82008425c07de2961d888555deb4e3c))


### Features

* improved rollup input handler ([c9abe72](https://github.com/aem-vite/vite-aem-plugin/commit/c9abe722d981763a8c5e1399d3de94308b90ebf5))

## [2.2.1](https://github.com/aem-vite/vite-aem-plugin/compare/v2.2.0...v2.2.1) (2022-08-16)


### Bug Fixes

* allow root of content path(s) to be proxied ([d467370](https://github.com/aem-vite/vite-aem-plugin/commit/d467370da4b623ae92b2c9a8e12e143a8e7fe24c))

# [2.2.0](https://github.com/aem-vite/vite-aem-plugin/compare/v2.1.0...v2.2.0) (2022-08-16)


### Features

* allow custom ClientLibs expressions ([4137cd9](https://github.com/aem-vite/vite-aem-plugin/commit/4137cd9ed2ef1960acc52397d9fc321bc576b78c))

# [2.1.0](https://github.com/aem-vite/vite-aem-plugin/compare/v2.0.0...v2.1.0) (2022-07-29)


### Features

* default builds to ES2015 for compatibility ([996f11b](https://github.com/aem-vite/vite-aem-plugin/commit/996f11b6c6ea9f7aca862077541683f8302fc8e6))

# [2.0.0](https://github.com/aem-vite/vite-aem-plugin/compare/v1.1.0...v2.0.0) (2022-07-29)


### Build System

* update npm dependencies ([d71e3c0](https://github.com/aem-vite/vite-aem-plugin/commit/d71e3c053ccb8a7bad0824d25de6ca46ee5d2f25))


### Features

* default builds to ES2015 for compatibility ([3f6c4a4](https://github.com/aem-vite/vite-aem-plugin/commit/3f6c4a4c307acd4ad3572f32591eced527954dc5))


### BREAKING CHANGES

* This plugin now requires Vite v3+. Please use v1 of this plugin for Vite 2 compatibility

# [2.0.0](https://github.com/aem-vite/vite-aem-plugin/compare/v1.0.1...v2.0.0) (2022-07-29)


### Build System

* update npm dependencies ([d71e3c0](https://github.com/aem-vite/vite-aem-plugin/commit/d71e3c053ccb8a7bad0824d25de6ca46ee5d2f25))


### Features

* default builds to ES2015 for compatibility ([3f6c4a4](https://github.com/aem-vite/vite-aem-plugin/commit/3f6c4a4c307acd4ad3572f32591eced527954dc5))


### BREAKING CHANGES

* This plugin now requires Vite v3+. Please use v1 of this plugin for Vite 2 compatibility

## [1.0.1](https://github.com/aem-vite/vite-aem-plugin/compare/v1.0.0...v1.0.1) (2022-07-20)


### Bug Fixes

* configured server options were missing ([04e5e31](https://github.com/aem-vite/vite-aem-plugin/commit/04e5e312bec2be1db90bdb5bcceb4ec578e1da06))

# 1.0.0 (2022-07-02)


### Bug Fixes

* add missing proxy paths ([9768155](https://github.com/aem-vite/vite-aem-plugin/commit/97681556d1dd68bdfecb3b3f088300e383a33bf2))
* correct default port for aem ([de09594](https://github.com/aem-vite/vite-aem-plugin/commit/de0959426c8813fcf5cc8a76e56714b08d65a590))
* remove import rewriter ([de59a2c](https://github.com/aem-vite/vite-aem-plugin/commit/de59a2ca352874db4df7aa16f978700951c10681))
* resolve incorrect plugin instance type ([77ea949](https://github.com/aem-vite/vite-aem-plugin/commit/77ea949ec48e83d462c5b5417919a1fb2d2d3f69))


### Build System

* increase minimum node version ([ce1ebe4](https://github.com/aem-vite/vite-aem-plugin/commit/ce1ebe497f4d0c2e8dd1e7347a486e37d7b4bf7d))


### Features

* initial public release ([a1677e6](https://github.com/aem-vite/vite-aem-plugin/commit/a1677e66cce352b8ced9d99507d342ebabd57716))
* restore import rewriter plugin ([5db5ebe](https://github.com/aem-vite/vite-aem-plugin/commit/5db5ebe485b848b948d834f43e633f8951614959))


### BREAKING CHANGES

* Increment minimum required node version to v14

As Node v12 is no longer supported we are bringing our minimum supported version of node to v14. Please ensure your project is up to date.

# [1.0.0-alpha.5](https://github.com/aem-vite/vite-aem-plugin/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2022-07-01)


### Bug Fixes

* correct default port for aem ([de09594](https://github.com/aem-vite/vite-aem-plugin/commit/de0959426c8813fcf5cc8a76e56714b08d65a590))

# [1.0.0-alpha.4](https://github.com/aem-vite/vite-aem-plugin/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2022-06-14)


### Build System

* increase minimum node version ([ce1ebe4](https://github.com/aem-vite/vite-aem-plugin/commit/ce1ebe497f4d0c2e8dd1e7347a486e37d7b4bf7d))


### Features

* restore import rewriter plugin ([5db5ebe](https://github.com/aem-vite/vite-aem-plugin/commit/5db5ebe485b848b948d834f43e633f8951614959))


### BREAKING CHANGES

* Increment minimum required node version to v14

As Node v12 is no longer supported we are bringing our minimum supported version of node to v14. Please ensure your project is up to date.

# [1.0.0-alpha.3](https://github.com/aem-vite/vite-aem-plugin/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2022-05-26)


### Bug Fixes

* add missing proxy paths ([9768155](https://github.com/aem-vite/vite-aem-plugin/commit/97681556d1dd68bdfecb3b3f088300e383a33bf2))
* remove import rewriter ([de59a2c](https://github.com/aem-vite/vite-aem-plugin/commit/de59a2ca352874db4df7aa16f978700951c10681))

# [1.0.0-alpha.2](https://github.com/aem-vite/vite-aem-plugin/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2022-05-26)


### Bug Fixes

* resolve incorrect plugin instance type ([77ea949](https://github.com/aem-vite/vite-aem-plugin/commit/77ea949ec48e83d462c5b5417919a1fb2d2d3f69))

# 1.0.0-alpha.1 (2022-02-18)


### Features

* initial public release ([a1677e6](https://github.com/aem-vite/vite-aem-plugin/commit/a1677e66cce352b8ced9d99507d342ebabd57716))
