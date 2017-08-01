var app = require('ampersand-app');
var Spot = require('spot-framework');
var BaseWidget = require('./base-widget');
var Vis = require('vis');
var colors = require('../../colors');
var misval = Spot.util.misval;
var util = require('./util');

function deinitChart (view) {
  if (view._graph3d) {
    delete view._graph3d;
  }
  view.isInitialized = false;
}

function initChart (view) {
  // Configure plot
  view._config = view.model.scatterConfig();

  var filter = view.model.filter;
  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');
  var tertiary = filter.partitions.get(3, 'rank');

  // axes labels
  if (primary.showLabel) {
    view._config.xLabel = primary.label;
  } else {
    view._config.xLabel = '';
  }
  if (secondary.showLabel) {
    view._config.yLabel = secondary.label;
  } else {
    view._config.yLabel = '';
  }
  if (tertiary.showLabel) {
    view._config.zLabel = tertiary.label;
  } else {
    view._config.zLabel = '';
  }

  // set ranges
  view._config.xMin = primary.minval;
  view._config.xMax = primary.maxval;
  view._config.yMin = secondary.minval;
  view._config.yMax = secondary.maxval;
  view._config.zMin = tertiary.minval;
  view._config.zMax = tertiary.maxval;

  // force a square full size plot
  var width = view.el.offsetWidth;
  var height = view.el.offsetHeight;

  view._config.width = width + 'px';
  view._config.height = height + 'px';

  // click callback
  view._config.onclick = function (point) {
    var groupx = primary.groups.models[point.i];
    primary.updateSelection(groupx);

    var groupy = secondary.groups.models[point.j];
    secondary.updateSelection(groupy);

    var groupz = tertiary.groups.models[point.k];
    tertiary.updateSelection(groupz);

    view.model.filter.updateDataFilter();
    app.me.dataview.getData();
  };

  // add dummy data point
  var visData = new Vis.DataSet();
  visData.add({x: 0, y: 0, z: 0, style: colors.unselectedColor.hex()});

  // add plot to the DOM
  view._graph3d = new Vis.Graph3d(view.el, visData, view._config);

  // monkeypatch the float -> color function to use our own scale
  // This probably breaks Visjs but not the parts we use
  view._graph3d._hsv2rgb = function (h, s, v) {
    // is called for hue in [0, 240]
    return colors.getColorFloat(h / 240.0).hex();
  };

  view.isInitialized = true;
}

function update (view) {
  if (!view.isInitialized) {
    return;
  }

  var filter = view.model.filter;

  var primary = filter.partitions.get(1, 'rank');
  var secondary = filter.partitions.get(2, 'rank');
  var tertiary = filter.partitions.get(3, 'rank');

  var valueFn = function (group) {
    if (group.count !== misval) {
      return parseFloat(group.count) || null;
    }
    return null;
  };

  var colorFn;
  var dataMin = 0;
  var dataMax = 1;
  var aggregate = filter.aggregates.get(1, 'rank');
  if (aggregate) {
    dataMin = filter.data.reduce(function (prev, curr) {
      if (prev.aa === misval || curr.aa === misval) {
        return curr;
      }
      return prev.aa < curr.aa ? prev : curr;
    }).aa;

    dataMax = filter.data.reduce(function (prev, curr) {
      if (prev.aa === misval || curr.aa === misval) {
        return curr;
      }
      return prev.aa < curr.aa ? curr : prev;
    }).aa;

    colorFn = function (aa) {
      if (aa !== misval) {
        var c = parseFloat(aa) || 0;
        c = (c - dataMin) / (dataMax - dataMin);
        return colors.getColorFloat(c).hex();
      }
      return 0;
    };

    // update Vis.Graph3d config
    // BUG: the legend leads to inifite loop in step.next() (or so) when manully forcing the colors in data.style
    view._graph3d.defaultValueMin = dataMin;
    view._graph3d.defaultValueMax = dataMax;

    // update Vis.Graph3d config
    // TODO: view._graph3d.showLegend = true;
  } else {
    colorFn = function (group) {
      return colors.getColor(0).hex();
    };

    // update Vis.Graph3d config
    view._graph3d.showLegend = false;
  }

  // update the data
  var visData = new Vis.DataSet();

  var Fx = primary.filterFunction();
  var Fy = secondary.filterFunction();
  var Fz = tertiary.filterFunction();

  var dotColor = function (group) {
    if (Fx(group.a) && Fy(group.b) && Fz(group.c)) {
      return colorFn(group.aa);
    } else {
      return colors.unselectedColor.hex();
    }
  };

  filter.data.forEach(function (group) {
    if (valueFn(group)) {
      var i = util.partitionValueToIndex(primary, group.a);
      var j = util.partitionValueToIndex(secondary, group.b);
      var k = util.partitionValueToIndex(tertiary, group.c);

      if (i === +i && j === +j && k === +k) {
        visData.add({
          x: primary.groups.models[i].value,
          y: secondary.groups.models[j].value,
          z: tertiary.groups.models[k].value,
          style: dotColor(group),
          i: i,
          j: j,
          k: k
        });
      }
    }
  });
  view._graph3d.setData(visData);
  view._graph3d.valueRange.min = dataMin;
  view._graph3d.valueRange.max = dataMax;
  view._graph3d.redraw();
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
