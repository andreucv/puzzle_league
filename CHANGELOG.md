# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [1.1.0](https://github.com/andreucv/puzzle_league/compare/v1.0.0...v1.1.0) (2026-09-17)


### ✨ Features

* last results cards follow style design ([8b8636b](https://github.com/andreucv/puzzle_league/commit/8b8636b4707a605e7fbf6389af9f6e3866ad96c6))
* printing entry cards for tables with QR code pointing to results or during_competition ([ef0c440](https://github.com/andreucv/puzzle_league/commit/ef0c440537015daea90e068663564f5d33071acf))
* publish ready data into create competition form ([772b6f3](https://github.com/andreucv/puzzle_league/commit/772b6f39d527c58e83ecf8b89b3d4a45dae06960))


### 🐛 Bug Fixes

* disable polling coming from hmr docker environment ([3b7e0cc](https://github.com/andreucv/puzzle_league/commit/3b7e0cce2bc1e776429bc2fdd0b23e2c2a4fb720))
* enhance user experience at home page and in explore_competition page ([eaa5635](https://github.com/andreucv/puzzle_league/commit/eaa5635fec2f59713e314a8188bc88879e3817e8))
* onboarding components contry and phone prefix do sort the most probable value the first one ([affdef2](https://github.com/andreucv/puzzle_league/commit/affdef2c900c03a1077ddab4414ebf9a934628a9))
* phone prefix input stays when the user inserted it ([94b9ecd](https://github.com/andreucv/puzzle_league/commit/94b9ecd5b1583cd332b72d4d55a15399f5dd987c))


### ⚡ Performance

* debug boot traces and vite eager warmup hooks.server.ts ([7c1228e](https://github.com/andreucv/puzzle_league/commit/7c1228e345feb4b149ea72d44524dc75533061ca))

## [1.0.0](https://github.com/andreucv/puzzle_league/compare/v0.6.3...v1.0.0) (2026-06-28)

## [0.6.3](https://github.com/andreucv/puzzle_league/compare/v0.6.1...v0.6.3) (2026-06-28)


### ✨ Features

* phase 0: price priming in create competition ([1c2c4c1](https://github.com/andreucv/puzzle_league/commit/1c2c4c12a28662a7aa30e9e13e99e77426802edd))


### 🐛 Bug Fixes

* catalan wording in homepage. issue 119 ([0eeba62](https://github.com/andreucv/puzzle_league/commit/0eeba623d45a6bdeecfc07142c10a2317175a579))
* text according action request_permission. issue 122 ([7bc3c19](https://github.com/andreucv/puzzle_league/commit/7bc3c19344368afb282d70fd1c0ba3ad366c6977))
* translations on payment warning checked. issue 121 ([2e4934c](https://github.com/andreucv/puzzle_league/commit/2e4934cc87c5b327cdd90bf1b0796f1fd4596b14))
* update pnpm-lock.yaml ([831f099](https://github.com/andreucv/puzzle_league/commit/831f0994f3f96cc38b58e8b531e5388ad7c7913f))
* use lang for time pickers in chrome browser. issue 98 ([0fb63c1](https://github.com/andreucv/puzzle_league/commit/0fb63c1ccce17908a5de7600a8f002b0e6104847))
* whitelist api/ably-token/public endpoint ([2c2a20c](https://github.com/andreucv/puzzle_league/commit/2c2a20cfc9dff5e3de322722279903c4cd999d91))


### ⚡ Performance

* **db:** add indexes on hot foreign keys and reduce live-path query ([fe669d6](https://github.com/andreucv/puzzle_league/commit/fe669d6a124e6a9234d42d246c6b681ddab03f48))
* **db:** cache strategy for competitionId and creatorId ([aadafa5](https://github.com/andreucv/puzzle_league/commit/aadafa5a21c0a927af132f12716452afc5ec1f72))
* load test infrastructure ([b84e6d0](https://github.com/andreucv/puzzle_league/commit/b84e6d0826a55bcf044b1ed4e22816b8064ab6bd))
* **loadtest:** optimize cookie usage in loadtest ([8718f39](https://github.com/andreucv/puzzle_league/commit/8718f39bcfc6a6069bf825b0c6c4fbb33475f089))
* removed log in hooks.server.ts ([cc32dfe](https://github.com/andreucv/puzzle_league/commit/cc32dfe6080fce47756e9aa483ecb9d19547c599))

## [0.6.2](https://github.com/andreucv/puzzle_league/compare/v0.6.1...v0.6.2) (2026-06-21)


### 🐛 Bug Fixes

* catalan wording in homepage. issue 119 ([0eeba62](https://github.com/andreucv/puzzle_league/commit/0eeba623d45a6bdeecfc07142c10a2317175a579))
* text according action request_permission. issue 122 ([7bc3c19](https://github.com/andreucv/puzzle_league/commit/7bc3c19344368afb282d70fd1c0ba3ad366c6977))
* translations on payment warning checked. issue 121 ([2e4934c](https://github.com/andreucv/puzzle_league/commit/2e4934cc87c5b327cdd90bf1b0796f1fd4596b14))
* update pnpm-lock.yaml ([831f099](https://github.com/andreucv/puzzle_league/commit/831f0994f3f96cc38b58e8b531e5388ad7c7913f))
* use lang for time pickers in chrome browser. issue 98 ([0fb63c1](https://github.com/andreucv/puzzle_league/commit/0fb63c1ccce17908a5de7600a8f002b0e6104847))
* whitelist api/ably-token/public endpoint ([2c2a20c](https://github.com/andreucv/puzzle_league/commit/2c2a20cfc9dff5e3de322722279903c4cd999d91))


### ⚡ Performance

* **db:** add indexes on hot foreign keys and reduce live-path query ([fe669d6](https://github.com/andreucv/puzzle_league/commit/fe669d6a124e6a9234d42d246c6b681ddab03f48))
* **db:** cache strategy for competitionId and creatorId ([aadafa5](https://github.com/andreucv/puzzle_league/commit/aadafa5a21c0a927af132f12716452afc5ec1f72))
* load test infrastructure ([b84e6d0](https://github.com/andreucv/puzzle_league/commit/b84e6d0826a55bcf044b1ed4e22816b8064ab6bd))
* **loadtest:** optimize cookie usage in loadtest ([8718f39](https://github.com/andreucv/puzzle_league/commit/8718f39bcfc6a6069bf825b0c6c4fbb33475f089))
* removed log in hooks.server.ts ([cc32dfe](https://github.com/andreucv/puzzle_league/commit/cc32dfe6080fce47756e9aa483ecb9d19547c599))

## [0.6.1](https://github.com/andreucv/puzzle_league/compare/v0.6.0...v0.6.1) (2026-06-14)


### ✨ Features

* release bumps on test branch and git tags on main merge ([68cfcd7](https://github.com/andreucv/puzzle_league/commit/68cfcd7d13c53e4c8bbbd4f6f838c914fe867fe5))

## [0.6.0](https://github.com/andreucv/puzzle_league/compare/v0.5.0...v0.6.0) (2026-06-14)


### ✨ Features

* categories auto-stop and unread notifications features work ([8fbb4ff](https://github.com/andreucv/puzzle_league/commit/8fbb4ffd3acb9f6981c7dd2e0b6c531befc09bb3))
* categories auto-stop and unread notifications features work ([8fbb4ff](https://github.com/andreucv/puzzle_league/commit/8fbb4ffd3acb9f6981c7dd2e0b6c531befc09bb3))
* category live auto-stop fully functional ([17ba02e](https://github.com/andreucv/puzzle_league/commit/17ba02e865a533ebaea9010ad34c7c185fa58a4f))
* unread notifications now fully functional after-navigation ([3b2ab98](https://github.com/andreucv/puzzle_league/commit/3b2ab98ded3a84ad2fcdba67313ad28aae1b0f3d))


### 🐛 Bug Fixes

* cron jobs now are signed and scheduled in QStash ([c8ea9e0](https://github.com/andreucv/puzzle_league/commit/c8ea9e0c6d5a38eafc81bb6e6b144e0b6ef656dd))
* sending verification mail in onboarding step awaited to be sent. issue [#79](https://github.com/andreucv/puzzle_league/issues/79) ([d9bfd11](https://github.com/andreucv/puzzle_league/commit/d9bfd117e0b17d764ee9b094e995e91028f0d707))
* translations now only inform about in-app notification. issue [#104](https://github.com/andreucv/puzzle_league/issues/104) ([0016ec5](https://github.com/andreucv/puzzle_league/commit/0016ec55acad3edd916cbe57cf01dcb54b4ed28b))
* upcoming competitions now reconciled between homepage and explore_competitions. issue [#75](https://github.com/andreucv/puzzle_league/issues/75) ([bd7dc11](https://github.com/andreucv/puzzle_league/commit/bd7dc11f40a9c1738fc84fceadeaa2637227f085))
* use correct translation when user already exists ([7232391](https://github.com/andreucv/puzzle_league/commit/72323914121b9f541eaad359a481f707c10d830c))

## [0.5.0](https://github.com/andreucv/puzzle_league/compare/v0.4.0...v0.5.0) (2026-06-13)


### ✨ Features

* add Whats New modal and rpreview build version ([a3b7daa](https://github.com/andreucv/puzzle_league/commit/a3b7daa274c1478f010e0e2c2c3d1389b2f2aceb))


### 🐛 Bug Fixes

* 96 ([0d388dd](https://github.com/andreucv/puzzle_league/commit/0d388dd4a6aa37b910aa45f4f10fde8f86460b06))
* use session id ([7671bc5](https://github.com/andreucv/puzzle_league/commit/7671bc59bf9b6afe2463f7216cefa8b7a60471a4))
* use session id ([34b5a01](https://github.com/andreucv/puzzle_league/commit/34b5a011f5b5f5408fdc733292f88a9721a03d04))
