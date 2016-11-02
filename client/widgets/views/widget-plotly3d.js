var AmpersandView = require('ampersand-view');
var Plotly = require('plotly.js');
var misval = require('../../../framework/util/misval.js');

function onClick (view, data) {
  var filter = view.model.filter;
  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');
  var tertiary = filter.partitions.get(3, 'rank');

  var pointId = data.points[0].pointNumber;
  var i = data.points[0].data.i[pointId];
  var j = data.points[0].data.j[pointId];
  var k = data.points[0].data.k[pointId];

  var groupx = primary.groups.models[i];
  primary.updateSelection(groupx);

  var groupy = secondary.groups.models[j];
  secondary.updateSelection(groupy);

  var groupz = tertiary.groups.models[k];
  tertiary.updateSelection(groupz);

  view.model.filter.updateDataFilter();

  // wait for the next mouse click
  view.el.once('plotly_click', function (data) {
    onClick(view, data);
  });
}

function deinitChart (view) {
  if (view._plotly) {
    Plotly.purge(view.el);
    delete view._plotly;
  }
}

function initChart (view) {
  // tear down existing stuff
  deinitChart(view);

  view._config = view.model.plotlyConfig();

  // axes labels and title
  view._config.layout.title = view.model.getTitle();
  view._config.layout.scene.xaxis.title = view.model.getXLabel();
  view._config.layout.scene.yaxis.title = view.model.getYLabel();
  view._config.layout.scene.zaxis.title = view.model.getZLabel();

  // force a square full size plot
  var width = view.el.offsetWidth;
  var height = view.el.offsetHeight;

  view._config.layout.width = width;
  view._config.layout.height = height;

  // add plot to the DOM
  view._plotly = Plotly.newPlot(view.el, [view._config.data], view._config.layout, view._config.options);

  // wait for a mouse click
  // NOTE:  use 'once' because the update after selection also triggers a click,
  //        which leads to an infinite loop
  view.el.once('plotly_click', function (data) { onClick(view, data); });
}

function plot (view) {
  var filter = view.model.filter;
  if (filter.isConfigured && filter.data.length > 0) {
    updateScatter(view);
    Plotly.update(view.el);
  }
}

function updateScatter (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');
  var tertiary = filter.partitions.get(3, 'rank');

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

  // update the data
  var d = 0;
  filter.data.forEach(function (group) {
    if (AtoI.hasOwnProperty(group.a) && BtoJ.hasOwnProperty(group.b) && CtoK.hasOwnProperty(group.c) && group.aa !== misval) {
      var val = parseFloat(group.aa) || 0;
      if (val !== 0) {
        var i = AtoI[group.a];
        var j = BtoJ[group.b];
        var k = CtoK[group.c];

        if (i === +i && j === +j && k === +k) {
          chartData.x[d] = xgroups.models[i].value;
          chartData.y[d] = ygroups.models[j].value;
          chartData.z[d] = zgroups.models[k].value;

          chartData.i[d] = i;
          chartData.j[d] = j;
          chartData.k[d] = k;
          d++;
        }
      }
    }
  });

  // remove remaining points
  chartData.x.splice(d, chartData.x.length - d);
  chartData.y.splice(d, chartData.y.length - d);
  chartData.z.splice(d, chartData.z.length - d);
  chartData.i.splice(d, chartData.i.length - d);
  chartData.j.splice(d, chartData.j.length - d);
  chartData.k.splice(d, chartData.k.length - d);
}

module.exports = AmpersandView.extend({
  template: '<div class="widgetInner mdl-card__media"></div>',
  renderContent: function () {
    initChart(this);
    plot(this);

    // redraw when the model indicates new data is available
    var filter = this.model.filter;
    filter.on('newData', function () { plot(this); }, this);

    this.on('remove', function () {
      filter.off('newData');
      Plotly.purge(this.el);
    }, this);
  },

  update: function () {
    plot(this);
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});
