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
    return null;
  }
}

/**
 * prepare data structure, reuse as much of the previous data arrays as possible
 * to prevent massive animations on every update
 * @params{ChartJSData} chartData ChartJS data structure
 * @params{Partition} partitionA X-axis
 * @params{Partition} partitionB Y-axis
 * @params{Object} options Options: perItem, multiDimensional, extraDataset
 */
function resizeChartjsData (chartData, partitionA, partitionB, options) {
  var x = partitionA ? partitionA.groups.length : 1;
  var y = partitionB ? partitionB.groups.length : 1;

  options = options || {};
  var perItem = options.perItem || false;
  var multiDimensional = options.multiDimensional || false;

  var i;
  var j;
  var cut;

  // labels on the primary axis
  if (partitionA && partitionA.groups && partitionA.groups.length > 0) {
    for (i = 0; i < x; i++) {
      chartData.labels[i] = partitionA.groups.models[i].label;
    }
  }

  // match the number of subgroups
  cut = chartData.datasets.length - y;
  if (options.extraDataset) {
    // add extra dataset to indicate selection on line plot
    cut = cut - 1;
  }
  if (cut > 0) {
    chartData.datasets.splice(0, cut);
  }

  for (j = 0; j < y; j++) {
    // update or assign data structure:
    chartData.datasets[j] = chartData.datasets[j] || {data: []};

    // match the existing number of groups to the updated number of groups
    cut = chartData.datasets[j].data.length - x;
    if (cut > 0) {
      chartData.datasets[j].data.splice(0, cut);
    }

    // clear out old data / pre-allocate new data
    for (i = 0; i < x; i++) {
      if (multiDimensional) {
        chartData.datasets[j].data[i] = {};
      } else {
        chartData.datasets[j].data[i] = 0;
      }
    }

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
}

module.exports = {
  partitionValueToIndex: partitionValueToIndex,
  resizeChartjsData: resizeChartjsData
};
