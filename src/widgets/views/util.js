var colors = require('../../colors');

/**
 * Get the index in chartjs datastructures from the group value
 * with proper fallbacks
 * @params {Partition} partition (optional)
 * @params {Object} value value
 * @returns {number|null} index
 */
function partitionValueToIndex (partition, value) {
  var group;

  if (!partition) {
    // no(sub)partitioning return first element
    return 0;
  }

  // with (sub)partitioning
  group = partition.groups.get(value, 'value');

  if (group) {
    // string in partition
    return group.groupIndex;
  } else {
    // string not in partition
    return -1;
  }
}

/**
 * prepare data structure, reuse as much of the previous data arrays as possible
 * to prevent massive animations on every update
 * @params{ChartJSData} chartData ChartJS data structure
 * @params{Partition} partitionA X-axis
 * @params{Partition} partitionB Y-axis
 * @params{Object} options Options: perItem, multiDimensional, doubleDatasets
 */
function resizeChartjsData (chartData, partitionA, partitionB, options) {
  var x = partitionA ? partitionA.groups.length : 1;
  var y = partitionB ? partitionB.groups.length : 1;

  options = options || {};
  var perItem = options.perItem || false;
  var multiDimensional = options.multiDimensional || false;
  var doubleDatasets = options.doubleDatasets || false;

  var totalDatasets = doubleDatasets ? 2 * y : y;

  var i;
  var j;
  var cut;

  // match the number of labels needed
  cut = chartData.labels.length - x;
  if (cut > 0) {
    chartData.labels.splice(0, cut);
  }

  // labels on the primary axis
  for (i = 0; i < x; i++) {
    chartData.labels[i] = partitionA.groups.models[i].label;
  }

  // match the number of datasets needed
  cut = chartData.datasets.length - totalDatasets;
  if (cut > 0) {
    // BUGFIX: weird behavious for linechart selections and plots
    // when we remove datasets from the front, everything shifts one place to the 'left',
    // which will cause issues for linecharts where we use an extra dataset at the back for selections.
    //
    // Solution: remove from the back
    chartData.datasets.splice(chartData.datasets.length, cut);
  }

  for (j = 0; j < totalDatasets; j++) {
    // update or assign data structure:
    chartData.datasets[j] = chartData.datasets[j] || {data: [], error: []};

    // match the existing number of groups to the updated number of groups
    cut = chartData.datasets[j].data.length - x;
    if (cut > 0) {
      chartData.datasets[j].data.splice(0, cut);
    }
    cut = chartData.datasets[j].error.length - x;
    if (cut > 0) {
      chartData.datasets[j].error.splice(0, cut);
    }

    // clear out old data / pre-allocate new data
    for (i = 0; i < x; i++) {
      if (multiDimensional) {
        chartData.datasets[j].data[i] = {};
        chartData.datasets[j].error[i] = {};
      } else {
        chartData.datasets[j].data[i] = 0;
        chartData.datasets[j].error[i] = 0;
      }
    }
  }

  // set metadata for main datasets
  for (j = 0; j < y; j++) {
    // set dataset color
    if (perItem) {
      chartData.datasets[j].backgroundColor = [];
      chartData.datasets[j].borderColor = [];
      for (i = 0; i < x; i++) {
        chartData.datasets[j].backgroundColor[i] = colors.getColor(0).css();
        // chartData.datasets[j].borderColor[i] = colors.getColor(0).css();
      }
    } else {
      chartData.datasets[j].backgroundColor = colors.getColor(j).css();
      chartData.datasets[j].borderColor = colors.getColor(j).css();
      chartData.datasets[j].fill = false;
    }

    // add a legend entry
    if (partitionB) {
      chartData.datasets[j].label = partitionB.groups.models[j].label;
    }
  }

  if (!doubleDatasets) {
    return;
  }

  // set metadata for doubled datasets
  for (j = y; j < 2 * y; j++) {
    chartData.datasets[j].borderDash = [15, 5]; // striped lines
    chartData.datasets[j].borderWidth = 1; // thin lines
    chartData.datasets[j].pointRadius = 0; // no points
    chartData.datasets[j].fill = false;

    // set dataset color
    if (perItem) {
      chartData.datasets[j].backgroundColor = [];
      chartData.datasets[j].borderColor = [];
      for (i = 0; i < x; i++) {
        chartData.datasets[j].backgroundColor[i] = colors.getColor(0).css();
        // chartData.datasets[j].borderColor[i] = colors.getColor(0).css();
      }
    } else {
      chartData.datasets[j].backgroundColor = colors.getColor(j - y).css();
      chartData.datasets[j].borderColor = colors.getColor(j - y).css();
    }

    // add a legend entry
    if (partitionB) {
      chartData.datasets[j].label = partitionB.groups.models[j - y].label;
    }
  }
}

module.exports = {
  partitionValueToIndex: partitionValueToIndex,
  resizeChartjsData: resizeChartjsData
};
