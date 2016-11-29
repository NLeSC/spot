var PageView = require('./base');
var templates = require('../templates');

module.exports = PageView.extend({
  template: templates.export,
  events: {
    'change [data-hook~=json-download]': 'downloadJSON',
    'change [data-hook~=csv-download]': 'downloadCSV'
  },
  downloadJSON: function () {
  },
  downloadCSV: function () {
  }
});
