# Spot - extensible facet browser
[![Build Status](https://travis-ci.org/NLeSC/spot.svg?branch=master)](https://travis-ci.org/NLeSC/spot)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/182235fbb0d44bb3aeeda9c67773f4be)](https://www.codacy.com/app/NLeSC/spot?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=NLeSC/spot&amp;utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/182235fbb0d44bb3aeeda9c67773f4be)](https://www.codacy.com/app/NLeSC/spot?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=NLeSC/spot&amp;utm_campaign=Badge_Coverage)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/Flet/semistandard)


## How to run it

As a fully stand-alone website, using crossfilter:

1. download/install [node.js](http://nodejs.org/)
2. install dependencies: `npm install`
3. run it: `npm start`
4. open http://localhost:9966 in a browser

### PostgreSQL 

Spot can also work with a postgresql database, but this requires a local service to run:

1. download and install normally, steps 1 to 4 above
2. manually enter the PostgreSQL username and password and database table name in `server/server-sql-util.js`. These are the variables `conString` and `DatabaseTable`.
3. run the server: `npm run server`

You can get a bit more performance using the native PostgreSQL bindings (turned off by default to make travisCI easier). Just install the pg-native package `npm install pg-native`.

## Credits

Jisk Attema, [the Netherlands eScience Center](http://nlesc.nl)

Ampersand by folks at [&yet](http://andyet.com)
Get the book: http://humanjavascript.com

