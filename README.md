# Urban Heat Island analyzer

This app was generated with the [ampersand cli tool](http://ampersandjs.com/learn/quick-start-guide).

## How to run it

1. download/install [node.js](http://nodejs.org/)
1. install dependencies: `npm install`
1. run it: `npm start`
1. open http://localhost:3000 in a browser

## Data creation
 ogr2ogr -t_srs "EPSG:4326" -s_srs "EPSG:28992" -sql 'select * from buurt_2012' -f GeoJSON geo.json  PG:
 topojson  --simplify-proportion=0.25 --filter=none --id-property gid geo.json -o topo.json

 i=data.json
 echo "[" > $i
 echo "SELECT row_to_json( buurtonly ) FROM buurtonly" | psql | tail -n +3 | head -n -2 | sed 's/$/,/' >> $i
 echo "]"  >> $i
 iconv -f utf8 -t ascii//TRANSLIT//IGNORE data.json > data.fixed

and then remove the last comma before the ']'


## How it's structured

PageView( template: pages.info  collection: app.avaliableWidgets)
    [widget-selector] widgetSelectorItemView(template: .  model: widget)
    [widgets] widgetView( template: includes.widget  collection: app.filters  model: histogramModel)
        [filter-selector] filterItemView( template: . model: filter )
        [widget] histogramView( template: includes.histogram  model: histogramModel)

## Credits

Built by folks at [&yet](http://andyet.com).

## Want a deeper understanding?

Get the book: http://humanjavascript.com
