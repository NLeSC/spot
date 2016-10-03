var AmpersandView = require('ampersand-view');
var templates = require('../templates');
var Plotly = require('plotly.js');

function getRanDims (nNum) {
  var randDims = new Object();
  var arrX = [];
  var arrY = [];
  var arrZ = [];
  while (arrX.length < nNum) {
    var randX = Math.ceil(Math.random() * 1000);
    var randY = Math.ceil(Math.random() * 1000);
    var randZ = Math.ceil(Math.random() * 1000);
    if (arrX.indexOf(randX) === -1) { arrX.push(randX); }
    if (arrY.indexOf(randY) === -1) { arrY.push(randY); }
    if (arrZ.indexOf(randZ) === -1) { arrZ.push(randZ); }
  }
  randDims[0] = arrX;
  randDims[1] = arrY;
  randDims[2] = arrZ;

  return randDims;
}

function normalizeGroupC (data) {
  var norm;
  var min = Number.MAX_VALUE;
  var max = -min;
  data.forEach(function (group) {
    var val = parseInt(group.aa) || 0;
    min = min <= val ? min : val;
    max = max >= val ? max : val;
  });
  if (min < 0) {
    // bubble radius should always be positive,
    // so take abs, and normalize by largest of |min| and max
    min = Math.abs(min);
    max = max < min ? min : max;

    norm = function (v) {
      return Math.abs(v) / max;
    };
  } else {
    norm = function (v) {
      return v / (max - min);
    };
  }
  return norm;
}

function initChart (view) {
  var filter = view.model.filter;

  // Configure plot
  view._config = view.model.plotlyConfig();
  var layout = view.model.plotLayout();
  var chartData = view._config.data;
  var options = view._config.options;
  var graphDiv = view.queryByHook('chart-area-plotly');

  var t1Dims = getRanDims(100);
  var t1 = {
    x: t1Dims[0],
    y: t1Dims[1],
    z: t1Dims[2],
    type: 'scatter3d',
    mode: 'markers'
  };

  var t2Dims = getRanDims(100);
  var t2 = {
    x: t2Dims[0],
    y: t2Dims[1],
    z: t2Dims[2],
    type: 'scatter3d',
    mode: 'markers'
  };

  var t3Dims = getRanDims(100);
  var t3 = {
    x: t3Dims[0],
    y: t3Dims[1],
    z: t3Dims[2],
    type: 'scatter3d',
    mode: 'markers'
  };

  var mydata = [t1, t2, t3];

  var mylayout = {
    autosize: false,
    width: 500,
    height: 500,
    margin: {
      l: 50,
      r: 50,
      b: 100,
      t: 100,
      pad: 4
    },
    plot_bgcolor: '#c7c7c7'
  };

  // console.log(data);
  // console.log(tracetest);

  // console.log(mydata);
  // console.log(layout);
  // console.log(options);
  console.log(filter);
  console.log(chartData);

  // view._plotly = Plotly.newPlot(graphDiv, mydata, layout, options);
  // view._plotly = Plotly.newPlot(graphDiv, mydata, layout);
  view._plotly = Plotly.newPlot(graphDiv, mydata, mylayout, options);

  // Plot using plotly
  // view._plotly = Plotly.newPlot(graphDiv, mydata, layout);
  // view._plotly = 0;

  // In callbacks on the chart we will need the view, so store a reference
  view._plotly._Ampersandview = view;

  // console.log(view._plotly);
  // console.log(view._plotly._Ampersandview);
}

function update3d (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var primary = filter.partitions.get('1', 'rank');
  var secondary = filter.partitions.get('2', 'rank');
  var tertiary = filter.partitions.get('3', 'rank');

  var xgroups = primary.groups;
  var ygroups = secondary.groups;
  var zgroups = tertiary.groups;

  // create lookup hashes
  var AtoI = {};
  var BtoJ = {};
  var CtoK = {};

  xgroups.forEach(function (xbin, i) {
    AtoI[xbin.value.toString()] = i;
  });
  ygroups.forEach(function (ybin, j) {
    BtoJ[ybin.value.toString()] = j;
  });
  zgroups.forEach(function (zbin, k) {
    CtoK[zbin.value.toString()] = k;
  });

  // Define data structure for plotly
  // Try to keep as much of the existing structure as possbile to prevent excessive animations
  chartData.datasets[0] = chartData.datasets[0] || {};
  chartData.datasets[0].data = chartData.datasets[0].data || [{}];

  var norm = normalizeGroupC(filter.data);

  // add data
  var d = 0;
  filter.data.forEach(function (group) {
    if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b) && CtoK.hasOwnProperty(group.c)) {
      var val = parseInt(group.aa) || 0;
      if (val > 0) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];
        var k = CtoK[group.c];

        if (i === +i && j === +j && k === +k) {
          chartData.datasets[0].data[d] = chartData.datasets[0].data[d] || {};
          chartData.datasets[0].data[d].x = xgroups.models[i].value;
          chartData.datasets[0].data[d].y = ygroups.models[j].value;
          chartData.datasets[0].data[d].z = zgroups.models[j].value;
          chartData.datasets[0].data[d].r = norm(val) * 50;
          d++;
        }
      }
    }
  });

  // remove remaining (unused) points
  var cut = chartData.datasets[0].data.length - d;
  if (cut > 0) {
    chartData.datasets[0].data.splice(d, cut);
  }
}

module.exports = AmpersandView.extend({
  template: templates.includes.widgetcontentPlotly,
  renderContent: function () {
    var filter = this.model.filter;

    // add a default chart to the view
    initChart(this);

    // redraw when the model indicates new data is available
    filter.on('newData', function () {
      this.update();
    }, this);

    // render data if available
    if (filter.isConfigured && filter.data) {
      this.update();
    }
  },

  update: function () {
    var filter = this.model.filter;
    var graphDiv = this.queryByHook('chart-area-plotly');

    console.log(filter.partitions);
    if (filter.isConfigured) {
      update3d(this);
    }
    // Hand over to Plotly for actual plotting
    this._plotly.newPlot(graphDiv);
  }
});
