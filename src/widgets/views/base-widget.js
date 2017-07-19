/**
 * Base Widget
 *
 * Base class to hold widget interaction. Extend and override properties for each chart.
 * @class BaseWidget
 */
var AmpersandView = require('ampersand-view');

module.exports = AmpersandView.extend({
  props: {
    /**
     * Boolean indicating if a chart has been added to the DOM
     */
    isInitialized: {
      type: 'boolean',
      required: true,
      default: false
    }
  },

  /**
   * Initialize the chart and add it to the DOM
   * Override for your specific widget.
   */
  initChart: function () {
    console.error('Can not call virtual method');
  },

  /**
   * Update the widget
   * Override for your specific widget.
   */
  update: function () {
    console.error('Can not call virtual method');
  },

  /**
   * Remove the widget from the DOM and free any associated data
   * Override for your specific widget.
   */
  deinitChart: function () {
    console.error('Can not call virtual method');
  },

  renderContent: function () {
  }
});
