var View = require('ampersand-view');
var SlotView = require('./slot');

module.exports = View.extend({
  template: '<div data-hook="slots" class="slots"></div>',
  render: function () {
    this.renderWithTemplate(this);
    this.renderCollection(this.collection, SlotView, this.queryByHook('slots'));
    return this;
  }
});
