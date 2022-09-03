---
sidebar_position: 4
---

# How to contribute

Ness.js is one of Leroy Wagner's first open source projects that is both under very active development and is also being used to ship code to everybody on [github.com](https://www.github.com). We're still working out the kinks to make contributing to this project as easy and transparent as possible, but we're not quite there yet. Hopefully this document makes the process for contributing clear and answers some questions that you may have.

## [Code of Conduct](https://github.com/leroywagner/Ness.js/blob/master/CODE_OF_CONDUCT.md) {#code-of-conduct}

Ness.js has adopted the [Contributor Covenant](https://www.contributor-covenant.org/) as its Code of Conduct, and we expect project participants to adhere to it. Please read [the full text](https://github.com/leroywagner/Ness.js/blob/master/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.

### Open Development {#open-development}

All work on Ness.js happens directly on [GitHub](https://github.com/leroywagner/Ness.js). Both core team members and external contributors send pull requests which go through the same review process.

### Semantic Versioning {#semantic-versioning}

Ness.js follows [semantic versioning](https://semver.org/). We release patch versions for critical bugfixes, minor versions for new features or non-essential changes, and major versions for any breaking changes. When we make breaking changes, we also introduce deprecation warnings in a minor version so that our users learn about the upcoming changes and migrate their code in advance.

Every significant change is documented in the [changelog file](https://github.com/leroywagner/Ness.js/blob/master/CHANGELOG.md).

### Branch Organization {#branch-organization}

Submit all changes directly to the [`master branch`](https://github.com/leroywagner/Ness.js/tree/master). We don't use separate branches for development or for upcoming releases. We do our best to keep `master` in good shape, with all tests passing.

Code that lands in `master` must be compatible with the latest stable release. It may contain additional features, but no breaking changes. We should be able to release a new minor version from the tip of `master` at any time.

### Bugs {#bugs}

#### Where to Find Known Issues {#where-to-find-known-issues}

We are using [GitHub Issues](https://github.com/leroywagner/Ness.js/issues) for our public bugs. We keep a close eye on this and try to make it clear when we have an internal fix in progress. Before filing a new task, try to make sure your problem doesn't already exist.

### Proposing a Change {#proposing-a-change}

If you intend to change the public API, or make any non-trivial changes to the implementation, we recommend [filing an issue](https://github.com/leroywagner/Ness.js/issues/new). This lets us reach an agreement on your proposal before you put significant effort into it.

If you're only fixing a bug, it's fine to submit a pull request right away but we still recommend to file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.

### Your First Pull Request {#your-first-pull-request}

Working on your first Pull Request? You can learn how from this free video series:

**[How to Contribute to an Open Source Project on GitHub](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github)**

To help you get your feet wet and get you familiar with our contribution process, we have a list of **[good first issues](https://github.com/leroywagner/Ness.js/issues?q=is:open+is:issue+label:"good+first+issue")** that contain bugs that have a relatively limited scope. This is a great place to get started.

If you decide to fix an issue, please be sure to check the comment thread in case somebody is already working on a fix. If nobody is working on it at the moment, please leave a comment stating that you intend to work on it so other people don't accidentally duplicate your effort.

If somebody claims an issue but doesn't follow up for more than two weeks, it's fine to take it over but you should still leave a comment.

**Before submitting a pull request,** please make sure the following is done:

1. Fork [the repository](https://github.com/leroywagner/Ness.js) and create your branch from `master`.
2. Run `yarn` in the repository root.
3. If you've fixed a bug or added code that should be tested, add tests!
4. Ensure the test suite passes (`yarn test`). Tip: `yarn test --watch TestName` is helpful in development.
5. Run `yarn test --prod` to test in the production environment.
6. If you need a debugger, run `yarn debug-test --watch TestName`, open `chrome://inspect`, and press "Inspect".
7. Format your code with [prettier](https://github.com/prettier/prettier) (`yarn prettier`).
8. Make sure your code lints (`yarn lint`). Tip: `yarn linc` to only check changed files.
9. Run the [Flow](https://flowtype.org/) typechecks (`yarn flow`).
10. If you haven't already, complete the CLA.

### Contributor License Agreement (CLA) {#contributor-license-agreement-cla}

In order to accept your pull request, we need you to submit a CLA. You only need to do this once, so if you've done this for another Leroy Wagner open source project, you're good to go. If you are submitting a pull request for the first time, just let us know that you have completed the CLA and we can cross-check with your GitHub username.

### Development Workflow {#development-workflow}

After cloning React, run `yarn` to fetch its dependencies.
Then, you can run several commands:

* `yarn lint` checks the code style.
* `yarn linc` is like `yarn lint` but faster because it only checks files that differ in your branch.
* `yarn test` runs the complete test suite.
* `yarn test --watch` runs an interactive test watcher.
* `yarn test --prod` runs tests in the production environment.
* `yarn test <pattern>` runs tests with matching filenames.
* `yarn debug-test` is just like `yarn test` but with a debugger. Open `chrome://inspect` and press "Inspect".
* `yarn flow` runs the [Flow](https://flowtype.org/) typechecks.
* `yarn build` creates a `build` folder with all the packages.

### Style Guide {#style-guide}

We use an automatic code formatter called [Prettier](https://prettier.io/).
Run `yarn prettier` after making any changes to the code.

Then, our linter will catch most issues that may exist in your code.
You can check the status of your code styling by simply running `yarn linc`.

However, there are still some styles that the linter cannot pick up. If you are unsure about something, looking at [Airbnb's Style Guide](https://github.com/airbnb/javascript) will guide you in the right direction.

### Request for Comments (RFC) {#request-for-comments-rfc}

Many changes, including bug fixes and documentation improvements can be implemented and reviewed via the normal GitHub pull request workflow.

Some changes though are "substantial", and we ask that these be put through a bit of a design process and produce a consensus among the React core team.

The "RFC" (request for comments) process is intended to provide a consistent and controlled path for new features to enter the project. You can contribute by visiting the [rfcs repository](https://github.com/reactjs/rfcs).

### License {#license}

By contributing to Ness.js, you agree that your contributions will be licensed under its MIT license.
