var PageView = require('./base');
var templates = require('../templates');

var facetsEditGeneralView = require('../views/facetseditgeneral');
var facetsEditTypeView = require('../views/facetsedittype');
var facetsEditBasevalueView = require('../views/facetseditbasevalue');
var facetsEditTransformView = require('../views/facetsedittransform');
var facetsEditGroupingView = require('../views/facetseditgrouping');
var facetsEditReductionView = require('../views/facetseditreduction');

module.exports = PageView.extend({
    pageTitle: 'Facets - Edit',
    template: templates.pages.facetsedit,
    initialize: function (options) {
        this.widget = options.widget;
    },
    render: function () {
        this.renderWithTemplate();

        // If the facet is part of a widget, trigger updates
        this.once('remove', function () {
            if (this.widget) {
                this.widget.trigger('updatefacets');
            }
        }, this);
    },
    subviews: {
        general: {
            hook: 'facets-edit-general',
            prepareView: function (el) {
                return new facetsEditGeneralView({
                    el: el,
                    model: this.model
                });
            }
        },
        type: {                              
            hook: 'facets-edit-type',
            prepareView: function (el) {
                return new facetsEditTypeView({
                    el: el,
                    model: this.model
                });
            }
        },
        basevalue: {                         
            hook: 'facets-edit-basevalue',
            prepareView: function (el) {
                return new facetsEditBasevalueView({
                    el: el,
                    model: this.model
                });
            }
        },
        transform: {                         
            hook: 'facets-edit-transform',
            prepareView: function (el) {
                return new facetsEditTransformView({
                    el: el,
                    model: this.model
                });
            }
        },
        grouping: {                          
            hook: 'facets-edit-grouping',
            prepareView: function (el) {
                return new facetsEditGroupingView({
                    el: el,
                    model: this.model
                });
            }
        },
        reduction: {                         
            hook: 'facets-edit-reduction',
            prepareView: function (el) {
                return new facetsEditReductionView({
                    el: el,
                    model: this.model
                });
            }
        }
    },
});
