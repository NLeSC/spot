# Spot - extensible facet browser

## How to run it

As a fully stand-alone website, using crossfilter:

1. download/install [node.js](http://nodejs.org/)
2. install dependencies: `npm install`
3. run it: `npm start`
4. open http://localhost:9966 in a browser

### PostgreSQL 

Spot can also work with a postgresql database, but this requires a local service to run:

1. download and install normally, steps 1 to 4 above
2. manually enter the PostgreSQL username and password and database table name in `spot-server.js`. This are the variables `conString` and `DatabaseTable`.
3. run the server: `npm run server`


## Credits

Jisk Attema, [the Netherlands eScience Center](http://nlesc.nl)

Ampersand by folks at [&yet](http://andyet.com)
Get the book: http://humanjavascript.com

