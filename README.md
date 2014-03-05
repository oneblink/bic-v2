# Blink Intelligent Client v2

[![Build Status](https://travis-ci.org/blinkmobile/bic-v2.png)](https://travis-ci.org/blinkmobile/bic-v2)

[![Selenium Test Status](https://saucelabs.com/browser-matrix/blinkmobile-oss.svg)](https://saucelabs.com/u/blinkmobile-oss)

## Purpose

This project is the front-end component for our mobility platform. As such, the material here may be of limited use outside of our platform.

Opening this code serves primarily to encourage understanding and discussion.

An effort is underway to replace this project with a greater focus on maintainability and extensibility.

## History

This is a very old (and formally private) project, with roots traced back to 2009. The code base was originally built using Apple's [Dashcode](http://en.wikipedia.org/wiki/Dashcode) environment. The Apple-specific code was later exchanged for [jQuery](http://jquery.com/) to better support Android devices.

Whilst modern functionality is being delivered in a production capacity by this code, the design of the code itself is understandably a little less modern. Bear in mind that we've learned many lessons over the lifetime of this project, and plan to do things differently with its replacement.

## Contribution

Pull requests are welcome. However, pull requests that have limited or no impact on compatibility with the existing user base are preferred.

### Prerequisites

You will need [Compass](http://compass-style.org/) for CSS pre-processing, which means you'll need [Ruby](http://compass-style.org/).

You'll also need [Grunt](http://gruntjs.com/) for task automation, which means you'll need [Node.JS](http://nodejs.org/).

Third-party run-time dependencies are configured via [Bower](http://bower.io/).

### Git

This project follows the [git flow](http://nvie.com/posts/a-successful-git-branching-model/) branching model. Tooling for this is available [on GitHub](https://github.com/nvie/gitflow).

As such, the "develop" branch is the primary branch of this repository. The "master" branch is reserved for tagged releases, and always reflects the current code in production.

### Code Style

All new JavaScript work should comply with [JSLint](http://jslint.com/).

We prefer setting JSLint options at the top of every JavaScript file so that compliance is determined in a uniform manner, regardless of IDEs or text editors used. The only options we support are:

```
/*jslint browser:true, indent:2, node:true*/
```

On a per-case basis, we may temporarily disable a JSLint option for a specific block of code. Where this is done, a comment should explain why the exception is necessary.
