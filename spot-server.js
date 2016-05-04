"use strict";

var SqlDataset = require('./client/models/dataset-sql');
var io = require('socket.io')(3080);
var pg = require('pg');
var squel = require('squel').useFlavour('postgres');

// TODO: make this configurable
var conString = "postgres://jiska:postgres@localhost/jiska";
var DatabaseTable = 'buurtonly';

var dataset = new SqlDataset();

var scanAndReply = function (data) {
    var nfields = data.fields.length;

    var done_fields = 0;
    var reply = function () {
        done_fields++;
        if (done_fields == nfields) {
            console.log("server pushes: sync-facets");
            io.emit('sync-facets', dataset.toJSON());
        }
    };

    var field;
    for(field=0; field<nfields; field++) {
        let query;
        let name = data.fields[field].name;
        let description = 'Automatically detected facet, please check configuration';

        // TODO: guess missing data indicators, could be something with
        // ' select (abs(p_ongehuwd)/p_ongehuwd) * trunc(log(abs(p_ongehuwd))) as d, count(p_ongehuwd) from buurtonly group by d order by d asc; '

        // dataTypeID: 1700,         numeric
        // dataTypeID: 20, 21, 23,   integers
        // dataTypeID: 700, 701,     float8
        var type = data.fields[field].dataTypeID;
        if (type == 1700 || type == 20 || type == 21 || type == 23 || type == 700 || type == 701) {

            let addContinuous = function (result) {
                dataset.add({
                    name: name,
                    accessor: name,
                    type: 'continuous',
                    minval_astext: result.rows[0].min,
                    maxval_astext: result.rows[0].max,
                    description:description
                });
                reply();
            }
            query = squel.select()
                .from(DatabaseTable)
                .field('MIN(' + name + ')', 'min')
                .field('MAX(' + name + ')', 'max');

            QueryAndCallBack(query, addContinuous);
        }
        else {
            let addCategorial = function (result) {
                dataset.add({
                    name: name,
                    accessor: name,
                    type: 'categorial',
                    categories: result.rows,
                    description:description
                });
                reply();
            }
            let query = squel.select()
                .from(DatabaseTable)
                .field(name, 'category')
                .field(name, 'group')
                .field('COUNT(' + name + ')', 'count')
                .group('"group"')
                .group('"category"');

            QueryAndCallBack(query, addCategorial);
        }
    }

    // wait for all queries to finish
    // var pool = pg.pools.getOrCreate(conString);
    // while (pool.availableObjectsCount() != pool.getPoolSize()) {
    //     
    // };
    
}

var QueryAndCallBack = function (q,cb) {
    pg.connect(conString, function(err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }

        client.query(q.toString(), function(err, result) {

            console.log('Querying PostgreSQL:', q.toString());
            done();

            if (err) {
              return console.error('error running query', err);
            }
            cb(result);
        });
    });
};

io.on('connection', function (socket) {
    console.log("Connecting to client");

    socket.on('scanData', function (f) {
        var query = squel.select().from(DatabaseTable).limit(1);

        console.log("client requests: scanData");
        QueryAndCallBack(query, scanAndReply);
    });

    socket.on('sampleData', function (count) {
        var query = squel.select().from(DatabaseTable).limit(count);

        console.log("client requests: sampleData");

        var reply = function (result) {
            console.log("server pushes: sampleData");
            io.emit('sampleDdata', result.rows);
        };
        QueryAndCallBack(query, reply);
    });

    socket.on('disconnect', function () {
        console.log('Disconnecting from client');
    });

    socket.on('sync-facets', function (data) {
        console.log("client pushes: sync-facets");
        dataset.reset(data);
    });
});
