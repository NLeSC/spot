var BaseWidget = require('./base-widget');
var Plotly = require('plotly.js');
var misval = require('../../../framework/util/misval.js');
var util = require('./util');

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

  var filter = view.model.filter;
  if (!(filter && filter.isConfigured)) {
    return;
  }

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

function update (view) {
  var filter = view.model.filter;

  if (filter.isConfigured) {
    if (!view._plotly) {
      initChart(view);
    }
  } else {
    deinitChart(view);
    return;
  }

  updateScatter(view);
  Plotly.update(view.el);
}

function updateScatter (view) {
  var filter = view.model.filter;
  var chartData = view._config.data;

  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');
  var tertiary = filter.partitions.get(3, 'rank');

  var valueFn = function (group) {
    if (group.count !== misval) {
      return parseFloat(group.count) || null;
    }
    return null;
  };

  // update the data
  var d = 0;
  filter.data.forEach(function (group) {
    if (valueFn(group)) {
      var i = util.partitionValueToIndex(primary, group.a);
      var j = util.partitionValueToIndex(secondary, group.b);
      var k = util.partitionValueToIndex(tertiary, group.c);

      if (i === +i && j === +j && k === +k) {
        chartData.x[d] = primary.groups.models[i].value;
        chartData.y[d] = secondary.groups.models[j].value;
        chartData.z[d] = tertiary.groups.models[k].value;

        chartData.i[d] = i;
        chartData.j[d] = j;
        chartData.k[d] = k;
        d++;
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

module.exports = BaseWidget.extend({
  template: '<div class="widgetInner mdl-card__media"></div>',

  update: function () {
    update(this);
  },

  initChart: function () {
    initChart(this);
  },

  deinitChart: function () {
    deinitChart(this);
  }
});
