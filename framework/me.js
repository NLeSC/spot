/**
 * Main spot object.
 *
 * @class Me
 */
var AmpersandModel = require('ampersand-model');
var ClientDataset = require('./dataset/client');
var ServerDataset = require('./dataset/server');
var Datasets = require('./dataset/collection');
var utildx = require('./util/crossfilter');
var socketIO = require('socket.io-client');

/*
 * Connect to the spot-server using a websocket on port 3080 and setup callbacks
 *
 * @function
 * @params {me} me Main spot dataobject
 * @params {string} address URL of server, implicitly uses port 3080.
 */
function connectToServer (me, address) {
  var socket = socketIO(address + ':3080');

  me.dataset = new ServerDataset();

  socket.on('connect', function () {
    console.log('spot-server: connected');
    me.isConnected = true;
  });

  socket.on('disconnect', function () {
    console.log('spot-server: disconnected');
    me.isConnected = false;
  });

  socket.on('syncDatasets', function (data) {
    console.log('spot-server: syncDatasets');
    me.datasets = new Datasets(data);
  });

  socket.on('syncDataset', function (data) {
    console.log('spot-server: syncDataset');
    me.dataset.reset(data);
  });

  socket.on('syncFilters', function (data) {
    console.log('spot-server: syncFilters');
    me.dataset.filters.add(data, {merge: true});
  });

  socket.on('syncFacets', function (req) {
    console.log('spot-server: syncFacets');
    var dataset;
    if (req.datasetId === me.dataset.getId()) {
      dataset = me.dataset;
    } else {
      dataset = me.datasets.get(req.datasetId);
    }

    if (dataset && req.data) {
      dataset.facets.add(req.data, {merge: true});
    }
  });

  socket.on('newData', function (req) {
    console.log('spot-server: newData ' + req.filterId);
    var filter = me.dataset.filters.get(req.filterId);
    if (req.data) {
      filter.data = req.data;
      filter.trigger('newData');
    }
  });

  socket.on('newMetaData', function (req) {
    console.log('spot-server: newMetaData');
    me.dataset.dataTotal = parseInt(req.dataTotal);
    me.dataset.dataSelected = parseInt(req.dataSelected);
  });

  console.log('spot-server: connecting');
  socket.connect();

  me.socket = socket;
}

/*
 * Add or remove facets from a dataset to the global (merged) dataset
 * @param {Dataset} dataset Dataset set add or remove
 */
function toggleDatasetFacets (dataset) {
  var me = this;

  if (dataset.isActive) {
    // remove active facets in dataset from the global dataset...
    dataset.facets.forEach(function (facet) {
      if (!facet.isActive) {
        return;
      }

      // ...but only when no other active dataset contains it
      var facetIsUnique = true;
      me.datasets.forEach(function (otherDataset) {
        if (!otherDataset.isActive || otherDataset === dataset) {
          return;
        }
        if (otherDataset.facets.get(facet.name, 'name')) {
          facetIsUnique = false;
        }
      });
      if (facetIsUnique) {
        var toRemove = me.dataset.facets.get(facet.name, 'name');
        me.dataset.facets.remove(toRemove);
      }
    });
  } else if (!dataset.isActive) {
    // copy facets
    dataset.facets.forEach(function (facet) {
      // do nothing if facet is not active
      if (!facet.isActive) {
        return;
      }

      // default options for all facet types
      var options = {
        name: facet.name,
        accessor: facet.name,
        units: facet.units,
        isActive: true
      };

      // fine-tuned options per facet type
      if (facet.isTimeOrDuration) {
        var transformedType = facet.timeTransform.transformedType;
        if (transformedType === 'datetime') {
          transformedType = 'timeorduration';
        }
        options.type = transformedType;
      } else if (facet.isContinuous) {
        options.type = 'continuous';
      } else if (facet.isCategorial) {
        options.type = 'categorial';
      }

      // do not add if a similar facet already exists
      if (!me.dataset.facets.get(facet.name, 'name')) {
        me.dataset.facets.add(options);
      }
    });

    // rescan min/max values and categories for the newly added facets
    dataset.facets.forEach(function (facet) {
      if (facet.isActive) {
        var newFacet = me.dataset.facets.get(facet.name, 'name');

        if (newFacet.isContinuous || newFacet.isTimeOrDuration) {
          newFacet.setMinMax();
        } else if (newFacet.isCategorial) {
          newFacet.setCategories();
        }
      }
    });
  }
}

/*
 * Add or remove data from a dataset to the global (merged) dataset
 * @param {Dataset} dataset Dataset set add or remove
 */
function toggleDatasetData (dataset) {
  var me = this;

  if (dataset.isActive) {
    // if dataset is active, remove it:
    // ...clear all crossfilter filters
    this.dataset.filters.forEach(function (filter) {
      filter.dimension.filterAll();
    });

    // ...filter all data, originating from the dataset from the ataset
    var dimension = me.dataset.crossfilter.dimension(function (d) {
      return d._OriginalDatasetId;
    });
    dimension.filter(dataset.getId());

    // ...remove matching data
    me.dataset.crossfilter.remove();

    // ...restore original filters
    dimension.filterAll();
    dimension.dispose();
    me.dataset.filters.forEach(function (filter) {
      filter.updateDataFilter();
    });
  } else if (!dataset.isActive) {
    // if dataset is not active, add it
    // ...find facets to copy
    var dataTransforms = [];
    dataset.facets.forEach(function (facet) {
      // do nothing if facet is not active
      if (!facet.isActive) {
        return;
      }
      dataTransforms.push({
        key: facet.name,
        fn: utildx.valueFn(facet)
      });
    });

    // ...transform data
    var data = dataset.crossfilter.all();
    var transformedData = [];

    data.forEach(function (datum) {
      var transformedDatum = {};
      dataTransforms.forEach(function (transform) {
        transformedDatum[transform.key] = transform.fn(datum);
      });
      transformedDatum._OriginalDatasetId = dataset.getId();
      transformedData.push(transformedDatum);
    });

    // ...add to merged dataset
    me.dataset.crossfilter.add(transformedData);

    // ...rescan min/max values and categories for the newly added facets
    dataset.facets.forEach(function (facet) {
      if (facet.isActive) {
        var newFacet = me.dataset.facets.get(facet.name, 'name');

        if (newFacet.isContinuous || newFacet.isTimeOrDuration) {
          newFacet.setMinMax();
        } else if (newFacet.isCategorial) {
          newFacet.setCategories();
        }
      }
    });
  }

  // update counts
  me.dataset.dataTotal = me.dataset.crossfilter.size();
  me.dataset.dataSelected = me.dataset.countGroup.value();
}

/*
 * Add or a dataset to the global (merged) dataset
 * @param {Dataset} dataset Dataset set add or remove
 */
function toggleDataset (dataset) {
  var tables;
  var idx;

  toggleDatasetFacets.call(this, dataset);

  if (this.isConnected) {
    // for server side datasets, keep track of the database tables
    if (this.dataset.databaseTable.indexOf('|') > 0) {
      tables = this.dataset.databaseTable.split('|');
      idx = tables.indexOf(dataset.databaseTable);
    } else {
      tables = [];
      idx = -1;
    }

    if (idx === -1) {
      tables.push(dataset.databaseTable);
    } else {
      tables.splice(idx, 1);
    }
    this.dataset.databaseTable = tables.join('|');
  } else {
    // for client side datasets, manually merge the datasets
    toggleDatasetData.call(this, dataset);
  }

  dataset.isActive = !dataset.isActive;
}

module.exports = AmpersandModel.extend({
  type: 'user',
  props: {
    /**
     * A union of all active datasets
     * @memberof! Me
     * @type {Dataset}
     */
    dataset: ['any', false, function () {
      return new ClientDataset({
        isActive: true
      });
    }],
    /**
     * Is there a connection with a spot sever?
     * @memberof! Me
     * @type {boolean}
     */
    isConnected: ['boolean', true, false]
  },
  collections: {
    /**
     * Collection of all datasets
     * @memberof! Me
     * @type {Dataset[]}
     */
    datasets: Datasets
  },
  /**
   * Connect to a spot server
   * @memberof! Me
   * @function
   * @param {string} URL of the spot server
   */
  connectToServer: function (address) {
    connectToServer(this, address);
  },
  /**
   * Include or exclude a dataset from the current union
   * @memberof! Me
   * @function
   * @param {Dataset} dataset Dataset to include or exclude
   */
  toggleDataset: toggleDataset
});
