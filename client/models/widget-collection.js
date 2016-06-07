var Collection = require('ampersand-collection');
var widgetFactory = require('../widget-factory');

module.exports = Collection.extend({
  model: function (attrs, options) {
    return widgetFactory.newModel(attrs, options);
  },
  isModel: function (model) {
    return model.isState; // Allow any ampersand state to be stored
  },
  getAllData: function () {
    this.forEach(function (widget) {
      widget.getData();
    });
  }
});
