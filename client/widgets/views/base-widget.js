/**
 * Base Widget
 *
 * Base class to hold widget interaction. Extend and override properties for each chart.
 * @class BaseWidget
 */
var AmpersandView = require('ampersand-view');

module.exports = AmpersandView.extend({
  /**
   * Update the widget
   * Override for your specific widget.
   * Can be called any time, also when no data is available, or the widget
   * has not been drawn or initialized.
   */
  update: function () {
    console.error('Not implemented');
  },

  /**
   * Remove the widget from the DOM and free any associated data
   * Override for your specific widget.
   * Can be called any time, even when widget has not been drawn yet,
   * or the widet has already been deinitialized.
   */
  deinitChart: function () {
    console.error('Not implemented');
  },

  renderContent: function () {
    // try to redraw immediately
    this.update();

    // remove old signal handles
    var filter = this.model.filter;
    filter.off('newData');
    this.off('remove');

    // redraw when the model indicates new data is available
    filter.on('newData', function () {
      this.update();
    }, this);

    // stop redrawing when the widget is removed
    this.on('remove', function () {
      filter.off('newData');
      this.deinitChart();
    }, this);
  }
});
