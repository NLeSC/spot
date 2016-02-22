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

Persistent state is stored in a model:
    facet ids, filter ranges, and widget options

Volatile state is stored on the view:
    crossfilter groups and filters etc. 
    All methods on a view assume that 'this' points to the view itself; so:
        NOT: view.method(arguments) 
        YES: view.method.call(view,arguments);

### Data model

The data is assumed to consist of a set of objects or records; these objects are stored in the crossfilter.
A facet is a property of a object, for instance if the object is a person, one facet could be his or her age, or gender.

A facet is furhter of a **type**:
 * continuous : the base value is parsed as float, and number of grouping strategies are possible
 * categorial : the base value is treated as a string, this can be matched to a number of regexps to come to a final grouping
 * TODO: spatial, time, network

The base value of a facet is of a certain **kind**:
 * property : the string is treated as property name, or array index
 * math : the string is processed by MathJS to produce a value



### Analyze Page

Analyze Page
    view:       client/pages/analyze.js
    template:   templates/pages/analyze.jade
    collection: app.widgets or app.bookmarks -> an ampersand-collection containing displayed widgets

widgetFrameView
    view:       client/views/widget-frame.js
    template:   templates/includes/widgetframe.jade
    model:      a widget from the widgetFactory, base class client/view/widget-content.js
                model is shared with the child widget-content view
    collection: app.filters -> client/models/filter-collection.js

    task:       Manage 1st, 2nd, and 3d facets for its widgetContent
                Construct and remove the widget-content derived models, and widget-content derived views


widgetContentView
    view:       client/includes/.., base view client/view/widget-content.js
    template:   templates/includes/..
    model:      a widget from the widgetFactory, base class client/view/widget-content.js
                model is shared with the parent Widget view 
    task:       Show a plot and manage widget specific user interaction
                Construct and remove the widgetContent

## Credits

Jisk Attema, [the Netherlands eScience Center](http://nlesc.nl).

Ampersand by folks at [&yet](http://andyet.com).
Get the book: http://humanjavascript.com
