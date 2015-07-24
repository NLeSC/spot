var View = require('ampersand-view');

module.exports = View.extend({
    template: '<option data-hook="item"></option>',
    bindings: {
        'model.name': {
            type: 'text',
            hook: 'item',
        },
        'model.active': {
            type: 'toggle',
            hook: 'item',
        },
        'model.id': {
            type: 'value',
            hook: 'item',
        },
    },
});
