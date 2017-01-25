var AmpersandModel = require('ampersand-model');
var ClientDataset = require('./dataset/client');
var DatasetCollection = require('./dataset/collection');
var utildx = require('./util/crossfilter');

function exportClientData (dataset) {
  var allData = dataset.crossfilter.all();
  var data = [];

  allData.forEach(function (d, i) {
    if (dataset.crossfilter.isElementFiltered(i)) {
      var j = data.push(d);
      delete data[j - 1]._OriginalDatasetId;
    }
  });
  return data;
}

/**
 * Add or remove dataset to the global (merged) dataset
 * Adding means:
 *  * add facets from the dataset to the global facets
 *  * add (transformed) data to the gobal data
 * @param {Dataset[]} datasets Collecction of datasets
 * @param {Dataset} dataset Dataset set add or remove
 * @param {Dataset} globalDataset Global dataset
 */
function toggleClientDataset (datasets, dataset, globalDataset) {
  if (dataset.isActive) {
    // if dataset is active, remove it:
    // remove all crossfilter filters
    globalDataset.filters.forEach(function (filter) {
      filter.dimension.filterAll();
    });

    // remove all data, originating from the dataset, from the globalDataset
    var dimension = globalDataset.crossfilter.dimension(function (d) {
      return d._OriginalDatasetId;
    });
    dimension.filter(dataset.getId());
    globalDataset.crossfilter.remove();
    dimension.filterAll();
    dimension.dispose();

    // re-apply all crossfilter filters
    globalDataset.filters.forEach(function (filter) {
      filter.updateDataFilter();
    });

    // remove active facets in dataset from the global dataset...
    dataset.facets.forEach(function (facet) {
      if (!facet.isActive) {
        return;
      }

      // ...but only when no other active dataset contains it
      var facetIsUnique = true;
      datasets.forEach(function (otherDataset) {
        if (!otherDataset.isActive || otherDataset === dataset) {
          return;
        }
        if (otherDataset.facets.get(facet.name, 'name')) {
          facetIsUnique = false;
        }
      });
      if (facetIsUnique) {
        var toRemove = globalDataset.facets.get(facet.name, 'name');
        globalDataset.facets.remove(toRemove);
      }
    });
  } else if (!dataset.isActive) {
    // if dataset is not active, add it
    console.log('Adding dataset', dataset.name);
    var dataTransforms = [];

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
      if (!globalDataset.facets.get(facet.name, 'name')) {
        globalDataset.facets.add(options);
      }

      dataTransforms.push({
        key: facet.name,
        fn: utildx.valueFn(facet)
      });
    });

    // copy transformed data
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
    globalDataset.crossfilter.add(transformedData);

    // rescan min/max values and categories for the newly added facets
    dataset.facets.forEach(function (facet) {
      if (facet.isActive) {
        var newFacet = globalDataset.facets.get(facet.name, 'name');

        if (newFacet.isContinuous || newFacet.isTimeOrDuration) {
          newFacet.setMinMax();
        } else if (newFacet.isCategorial) {
          newFacet.setCategories();
        }
      }
    });
  }

  // update counts
  globalDataset.dataTotal = globalDataset.crossfilter.size();
  globalDataset.dataSelected = globalDataset.countGroup.value();

  dataset.isActive = !dataset.isActive;
}

module.exports = AmpersandModel.extend({
  type: 'user',
  props: {
    dataset: ['any', false, function () {
      return new ClientDataset({
        isActive: true
      });
    }]
  },
  collections: {
    datasets: DatasetCollection
  },
  toggleDataset: function (dataset) {
    toggleClientDataset(this.datasets, dataset, this.dataset);
  },
  exportClientData: function () {
    return exportClientData(this.dataset);
  }
});
