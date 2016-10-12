/**
 * Color handling
 *
 * All colors are a chroma.js color. See http://gka.github.io/chroma.js/
 * @module client/colors
 */
var Chroma = require('chroma-js');

var colors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];
var scale = Chroma.scale('Spectral');

/**
 * Get nth color
 * @param {number} color number
 * @returns {Object} color
 */
module.exports = {
  getColor: function getColor (i) {
    i = parseInt(i);
    if (i < 0 || i >= colors.length) {
      // pick a color from the scale defined above
      return scale(((i - colors.length) * (211 / 971)) % 1);
    } else {
      return Chroma(colors[i]);
    }
  },
  /**
   * Colorscale from 0 to 1
   */
  getColorFloat: function (f) {
    return scale(f);
  },
  /**
   * Color for unselected groups
   */
  unselectedColor: Chroma('#aaaaaa')
};
