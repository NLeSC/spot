# SPOT - extensible facet browser
[![DOI](https://zenodo.org/badge/56071453.svg)](https://zenodo.org/badge/latestdoi/56071453)
[![Build Status](https://travis-ci.org/NLeSC/spot.svg?branch=master)](https://travis-ci.org/NLeSC/spot)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/182235fbb0d44bb3aeeda9c67773f4be)](https://www.codacy.com/app/NLeSC/spot?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=NLeSC/spot&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/182235fbb0d44bb3aeeda9c67773f4be)](https://www.codacy.com/app/NLeSC/spot?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=NLeSC/spot&amp;utm_campaign=Badge_Coverage)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)


## How to run it

Make sure you have
[git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) installed
on your system.

Prerequisites for running SPOT as stand-alone website using crossfilter:

1. follow the instructions to install **node.js**:
    - [via package manager](https://nodejs.org/en/download/package-manager) (suggested)
    - [Binaries](https://nodejs.org/en/download)
2. clone this repository:
    ```bash
    git clone https://github.com/NLeSC/spot.git && cd spot
    ```
3. install dependencies:
    ```bash
    npm install
    ```
    **Note:** some dependencies may require 
    [node-gyp](https://github.com/nodejs/node-gyp). If you get errors during 
    compilation of this package, you may need to install following packages on 
    Ubuntu system or equivalent packages for your distribution.
    ```bash
    sudo apt-get install -y build-essential python libpq-dev
    ```
4. start the web server
    ```bash
    npm start
    ```
5. open http://localhost:9966 in a web browser

Building the website is only tested on Linux, but it should work on any OS (Mac
OS X for example) that is supported by node and npm.

Hosting the site can be done by any webserver.

Make sure that **Javascript is enabled** in your web browser. SPOT is fully
functional in **Google Chrome** and **Chromium** web browsers and it should work
in other web browsers. Otherwise, please [submit an
issue](https://github.com/NLeSC/spot/issues).

### ``npm run`` scripts

Tasks that should not normally be run directly have names starting with an 
underscore `_`.

| task  | description  |
|---|---|
| ``check`` | verifies the code base against the 'semistandard' code style standard and runs tests |
| ``coverage`` | calculates the test coverage |
| ``doc`` | generates the API docs from JSDoc code comments and puts the result under ``docs/api/`` |
| ``dist`` | generates the distributable app in the ``dist/`` directory |
| ``start`` | serves a live version of the distributable in the ``dist/`` directory |
| ``demo`` | copies the distributable in ``dist/`` to ``docs/app`` for hosting on github pages |
| ``clean`` | removes the content of some generated directories |
| ``test`` | verifies the code against 'semistandard' code style standard, runs the tests, and calculates the code coverage |
| ``build`` | generates the distributable in ``dist/`` but uses unuglified ``app.js`` | 
| ``postinstall`` | generates the templates; automatically invoked upon ``npm run install`` | 
| ``_static`` | copies the static assets to the ``dist/`` directory |
| ``_templates`` | generates the templates |
| ``_css`` | generates the style sheets |
| ``_css-watch`` | watches for changes in the style sheets |
| ``_uglify`` | generates the distributable in ``dist/`` using uglified ``app.js`` | 
| ``_fonts`` | copies the material design fonts to the ``dist/fonts`` directory |

### SQL Database

Spot can also work with a [PostgreSQL](https://www.postgresql.org) database, but
this requires either a local or a remote service to run. Commutication between
the client and the database server is achieved by using [web
socket](https://github.com/socketio/socket.io).

In order to use SPOT with a PostreSQL server, you need to clone the
[spot-server](https://github.com/NLeSC/spot-server) repository and follow the
instructions in the README. In general, these are the steps to follow:

1. make sure that PostreSQL service is runnning.

2. upload your data to the database with the `spot-import.js` script

3. run the ***SPOT-server***  with the `spot-server.js` script



## Desktop version

Desktop version of SPOT is still under development. Available downloads can be
found [here](https://github.com/fdiblen/spot-desktop-app/releases/tag/0.1.0).


## Documentation

The spot documentation can be found
[here](http://nlesc.github.io/spot/doc/spot/0.1.0/index.html).


## Credits

Jisk Attema, [the Netherlands eScience Center](http://nlesc.nl)

Ampersand by folks at [&yet](http://andyet.com)
Get the book: http://humanjavascript.com
