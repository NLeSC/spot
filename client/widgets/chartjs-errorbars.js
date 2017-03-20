// Code adapted from: https://github.com/CAYdenberg/Chart.js-ErrorBars.git
// Original license: MIT
// Original copyright: Copyright (c) 2013-2016 Nick Downie
'use strict';

module.exports = function (Chart, chartType, newType) {
  var helpers = Chart.helpers;

  // ErrorBar element
  Chart.elements.ErrorBar = Chart.elements.ErrorBar || Chart.Element.extend({
    draw: function () {
      var ctx = this._chart.ctx;
      var vm = this._view;

      if (vm.direction === 'none') {
        return;
      }

      var halfWidth = vm.capWidth / 2;
      var halfHeight = vm.capHeight / 2;

      var top = vm.yTop;
      var bottom = vm.yBottom;
      var left = vm.xLeft;
      var right = vm.xRight;

      ctx.strokeStyle = vm.strokeColor;
      ctx.lineWidth = vm.strokeWidth;

      // draw vertical error bar
      if (vm.direction === 'vertical' || vm.direction === 'both') {
        ctx.beginPath();
        ctx.moveTo(vm.x, top);
        ctx.lineTo(vm.x, bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vm.x - halfWidth, top);
        ctx.lineTo(vm.x + halfWidth, top);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vm.x - halfWidth, bottom);
        ctx.lineTo(vm.x + halfWidth, bottom);
        ctx.stroke();
      }

      // draw horizontal error bar
      if (vm.direction === 'horizontal' || vm.direction === 'both') {
        ctx.beginPath();
        ctx.moveTo(left, vm.y);
        ctx.lineTo(right, vm.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left, vm.y - halfHeight);
        ctx.lineTo(left, vm.y + halfHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(right, vm.y - halfHeight);
        ctx.lineTo(right, vm.y + halfHeight);
        ctx.stroke();
      }
    }
  });

  /**
   * Default config for errorbars:
   * errorDir: none, horizontal, vertical, both
   * errorStrokeWidth
   * errorCapWidth
   * errorCapHeight
   * errorColor
   */
  Chart.defaults[newType] = helpers.extend(Chart.defaults[chartType], {
    errorDir: 'vertical',
    errorStrokeWidth: 1,
    errorCapWidth: 2.5,
    errorCapHeight: 0.25,
    errorColor: 'rgba(0,0,0,1)'
  });

  // Extend chart type with error bar
  Chart.controllers[newType] = Chart.controllers[chartType].extend({
    initialize: function (chart, datasetIndex) {
      // call Super
      Chart.controllers[chartType].prototype.initialize.call(this, chart, datasetIndex);

      var options = chart.chart.config.options;
      options.errorDir = options.errorDir || Chart.defaults[newType].errorDir;
      options.errorCapWidth = options.errorCapWidth || Chart.defaults[newType].errorCapWidth;
      options.errorCapHeight = options.errorCapHeight || Chart.defaults[newType].errorCapHeight;
      options.errorStrokeColor = options.errorColor || Chart.defaults[newType].errorColor;
      options.errorStrokeWidth = options.errorStrokeWidth || Chart.defaults[newType].errorStrokeWidth;
    },

    addElements: function () {
      // call Super
      Chart.controllers[chartType].prototype.addElements.call(this);

      var meta = this.getMeta();
      var error = this.getDataset().error || [];
      var metaError = meta.error || [];
      var i, ilen;

      for (i = 0, ilen = error.length; i < ilen; i++) {
        metaError[i] = metaError[i] || new Chart.elements.ErrorBar({
          _chart: this.chart.chart,
          _datasetIndex: this.index,
          _index: i
        });
      }
      meta.error = metaError;
    },

    addElementAndReset: function (index) {
      // call Super
      Chart.controllers[chartType].prototype.addElementAndReset.call(this, index);

      var meta = this.getMeta();
      var metaError = meta.error;
      var metaData = meta.data;

      metaError[index] = metaError[index] || new Chart.elements.ErrorBar({
        _chart: this.chart.chart,
        _datasetIndex: this.index,
        _index: index,
        x: 0,
        y: 0
      });
      this.updateErrorBar(metaError[index], metaData[index], index, true);
    },

    update: function update (reset) {
      // call Super
      Chart.controllers[chartType].prototype.update.call(this, reset);

      var meta = this.getMeta();
      var metaData = meta.data;
      var metaError = meta.error;

      // make sure we don't have more error bars than points
      var cut = metaError.length - metaData.length;
      if (cut > 0) {
        metaError.splice(metaData.length, cut);
      }

      metaError.forEach(function (errorBar, index) {
        this.updateErrorBar(errorBar, metaData[index], index, reset);
      }, this);
    },

    updateErrorBar: function updateErrorBar (errorBar, element, index, reset) {
      var dataset = this.getDataset();
      var meta = this.getMeta();
      var xScale = this.getScaleForId(meta.xAxisID);
      var yScale = this.getScaleForId(meta.yAxisID);

      var options = this.chart.chart.config.options;

      var px = element._model.x;
      var py = element._model.y;

      var x = xScale.getValueForPixel(px);
      var y = yScale.getValueForPixel(py);

      var errorX;
      var errorY;
      if (typeof dataset.error[index] === 'object' && dataset.error[index] != null) {
        errorX = dataset.error[index].x;
        errorY = dataset.error[index].y;
      } else {
        errorX = dataset.error[index];
        errorY = dataset.error[index];
      }

      // Utility
      errorBar._chart = this.chart.chart;
      errorBar._xScale = xScale;
      errorBar._yScale = yScale;
      errorBar._datasetIndex = this.index;
      errorBar._index = index;

      errorBar._model = {
        // Position
        x: px,
        y: py,
        yTop: yScale.getPixelForValue(y + errorY, index, this.index, this.chart.isCombo),
        yBottom: yScale.getPixelForValue(y - errorY, index, this.index, this.chart.isCombo),
        xLeft: xScale.getPixelForValue(x - errorX, index, this.index, this.chart.isCombo),
        xRight: xScale.getPixelForValue(x + errorX, index, this.index, this.chart.isCombo),

        // Appearance
        capWidth: element._model.width * options.errorCapWidth || options.errorCapWidth,
        capHeight: element._model.height * options.errorCapHeight || options.errorCapHeight,
        direction: options.errorDir,
        strokeColor: options.errorStrokeColor,
        strokeWidth: options.errorStrokeWidth
      };

      errorBar.pivot();
    },

    draw: function (ease) {
      var easingDecimal = ease || 1;

      // call Super
      Chart.controllers[chartType].prototype.draw.call(this, ease);

      this.getMeta().error.forEach(function (errorBar, index) {
        // Chech for valid errror bar sizes:
        // 2-d datastructure: check error.x and error.y
        // 1-d datastructure: check error
        var e = this.getDataset().error[index];

        if (e !== null && typeof e === 'object') {
          if ((e.x !== null && e.x !== undefined && !isNaN(e.x)) || (e.y !== null && e.y !== undefined && !isNaN(e.y))) {
            errorBar.transition(easingDecimal).draw();
          }
        } else if (e !== null && e !== undefined && !isNaN(e)) {
          errorBar.transition(easingDecimal).draw();
        }
      }, this);
    }
  });
};
