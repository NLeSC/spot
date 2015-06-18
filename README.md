# Urban Heat Island analyzer

This app was generated with the [ampersand cli tool](http://ampersandjs.com/learn/quick-start-guide).

## How to run it

1. download/install [node.js](http://nodejs.org/)
1. install dependencies: `npm install`
1. run it: `npm start`
1. open http://localhost:3000 in a browser

## Data creation
 ogr2ogr -t_srs "EPSG:4326" -s_srs "EPSG:28992" -sql 'select * from ddddtopojson' -f GeoJSON geo.json  PG:
 topojson  --id-property gid geo.json -o topo.json


## How it's structured

See docs: http://ampersandjs.com/
Curated modules: http://tools.ampersandjs.com/

## Credits

Built by folks at [&yet](http://andyet.com).

## Want a deeper understanding?

Get the book: http://humanjavascript.com
