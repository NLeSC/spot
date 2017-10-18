/**
 *
 * Color handling
 *
 * All colors are a chroma.js color. See http://gka.github.io/chroma.js/
 * @module colors
 */
var chroma = require('chroma-js');

var colors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];
// alternative color scheme, needs some tuning:
// var colors = ['#cccccc', '#c2e06c', '#00168c', '#997100', '#eabd00', '#ff4889', '#f497ff', '#0db700', '#d26bb8', '#a8e74b', '#a83375', '#ff6a2b', '#8690ff', '#ff4b50', '#fb78ff', '#00a349', '#c6008f', '#4ef168', '#ff25a2', '#be6300', '#b667ff', '#ff9451', '#e113d2', '#cc0013', '#ff66e0'];
var scale = chroma.scale('Spectral');

module.exports = {
  /**
   * Get i-th color
   * @param {number} color number
   * @returns {Object} color
   */
  getColor: function getColor (i) {
    i = parseInt(i);
    if (i < 0 || i >= colors.length) {
      // pick a color from the scale defined above
      return scale(((i - colors.length) * (211 / 971)) % 1);
    } else {
      return chroma(colors[i]);
    }
  },
  /**
   * Colorscale from 0 to 1
   * @param  {number} f [description]
   * @return {number}   [description]
   */
  getColorFloat: function (f) {
    return scale(f);
  },
  /**
   * Color for unselected groups
   * @type {any}
   */
  unselectedColor: chroma('#aaaaaa')
};
