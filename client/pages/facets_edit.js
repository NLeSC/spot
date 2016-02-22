var PageView = require('./base');
var templates = require('../templates');
var util = require('../util');
var View = require('ampersand-view');

var categoryItem = require('../models/categoryitem');

var categoryItemView = View.extend({
    template: templates.includes.categoryitem,
    bindings: {
        'model.category': {
            type: 'value',
            hook: 'category-value-input'
        },
        'model.count': {
            type: 'text',
            hook: 'category-value-count'
        },
        'model.group': {
            type: 'value',
            hook: 'category-group-input'
        },
    },
    events: {
        'click [data-hook~=category-remove]':    'removeCategoryOne',
        'change [data-hook~=category-value-input]': 'changeCategoryGroup',
        'change [data-hook~=category-group-input]': 'changeCategoryValue',
    },
    changeCategoryValue: function () {
        this.model.group = this.queryByHook( 'category-group-input' ).value;
    },
    changeCategoryGroup: function () {
        this.model.value = this.queryByHook( 'category-value-input' ).value;
    },
    removeCategoryOne: function () {
        console.log( "Remove:", this.model );
        this.model.collection.remove(this.model);
    },
});


module.exports = PageView.extend({
    pageTitle: 'Facets - Edit',
    template: templates.pages.facetsedit,
    render: function () {
        this.renderWithTemplate(this);
        this.renderCollection(this.model.categories,
                              categoryItemView,
                              this.queryByHook('transform-categorial-table'));
    },
    bindings: {
        // Bindings for: general
        'model.name': {
            type: 'value',
            hook: 'general-title-input'
        },
        'model.units': {
            type: 'value',
            hook: 'general-units-input'
        },
        'model.description': {
            type: 'value',
            hook: 'general-description-input',
        },

        // Bindings for: Type
        'model.isContinuous': {
            type: 'booleanAttribute',
            hook: 'type-continuous',
            name: 'checked',
        },
        'model.isCategorial': {
            type: 'booleanAttribute',
            hook: 'type-categorial',
            name: 'checked',
        },
        'model.isSpatial': {
            type: 'booleanAttribute',
            hook: 'type-spatial',
            name: 'checked',
        },
        'model.isTime': {
            type: 'booleanAttribute',
            hook: 'type-time',
            name: 'checked',
        },
        'model.isNetwork': {
            type: 'booleanAttribute',
            hook: 'type-network',
            name: 'checked',
        },

        // Bindings for: base-value
        'model.accessor': {
            type: 'value',
            hook: 'base-value-accessor-input',
        },
        'model.bccessor': {
            type: 'value',
            hook: 'base-value-bccessor-input',
        },
        'model.misval_astext': {
            type: 'value',
            hook: 'base-value-missing-input',
        },
        'model.isProperty': {
            type: 'booleanAttribute',
            hook: 'base-value-kind-property',
            name: 'checked',
        },
        'model.isMath': {
            type: 'booleanAttribute',
            hook: 'base-value-kind-math',
            name: 'checked',
        },

        'model.base_value_time_format': {
            type: 'value',
            hook: 'base-value-time-format-input',
        },
        'model.base_value_time_zone': {
            type: 'value',
            hook: 'base-value-time-zone-input',
        },
        'model.base_value_time_reference': {
            type: 'value',
            hook: 'base-value-time-reference-input',
        },
        'model.isDatetimeInput': {
            type: 'booleanAttribute',
            hook: 'base-value-time-type-datetime-input',
            name: 'checked',
        },
        'model.isDurationInput': {
            type: 'booleanAttribute',
            hook: 'base-value-time-type-duration-input',
            name: 'checked',
        },

        // Bindings for: transform
        // Bindings for: transform-continuous
        'model.transformPercentiles': {
            type: 'booleanAttribute',
            hook: 'transform-continuous-percentiles-input',
            name: 'checked',
        },
        'model.transformExceedences': {
            type: 'booleanAttribute',
            hook: 'transform-continuous-exceedences-input',
            name: 'checked',
        },

        // Bindings for: transform-category
        
        // Bindings for: transform-time
        'model.transform_time_units': {
            type: 'value',
            hook: 'transform-time-units-input',
        },
        'model.transform_time_zone': {
            type: 'value',
            hook: 'transform-time-zone-input',
        },
        'model.transform_time_reference': {
            type: 'value',
            hook: 'transform-time-reference-input',
        },
        'model.transformNone': [
            {
                type: 'booleanAttribute',
                hook: 'transform-time-none-input',
                name: 'checked',
            },
            {
                type: 'booleanAttribute',
                hook: 'transform-continuous-none-input',
                name: 'checked',
            },
        ],
        'model.transformTimezone': {
            type: 'booleanAttribute',
            hook: 'transform-time-timezone-input',
            name: 'checked',
        },
        'model.transformToDatetime': {
            type: 'booleanAttribute',
            hook: 'transform-time-todatetime-input',
            name: 'checked',
        },
        'model.transformToDuration': {
            type: 'booleanAttribute',
            hook: 'transform-time-toduration-input',
            name: 'checked',
        },

        // Bindings for: grouping
        
        // Bindings for: grouping-general
        'model.minval_astext': {
            type: 'value',
            hook: 'grouping-general-minimum-input',
        },
        'model.maxval_astext': {
            type: 'value',
            hook: 'grouping-general-maximum-input',
        },

        // Bindings for: grouping-continuous
        'model.grouping_continuous_bins': {
            type: 'value',
            hook: 'grouping-continuous-bins-input',
        },
        'model.groupFixedN': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-fixedn-input',
            name: 'checked',
        },
        'model.groupFixedSC': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-fixedsc-input',
            name: 'checked',
        },
        'model.groupFixedS': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-fixeds-input',
            name: 'checked',
        },
        'model.groupLog': {
            type: 'booleanAttribute',
            hook: 'grouping-continuous-log-input',
            name: 'checked',
        },

        // Bindings for: grouping-time
        'model.grouping_time_format': {
            type: 'value',
            hook: 'grouping-time-format-input',
        },


        // Bindings for: reduction
        'model.reduceCount': {
            type: 'booleanAttribute',
            hook: 'reduction-count-input',
            name: 'checked',
        },
        'model.reduceSum': {
            type: 'booleanAttribute',
            hook: 'reduction-sum-input',
            name: 'checked',
        },
        'model.reduceAverage': {
            type: 'booleanAttribute',
            hook: 'reduction-average-input',
            name: 'checked',
        },

        'model.reduceAbsolute': {
            type: 'booleanAttribute',
            hook: 'reduction-type-absolute-input',
            name: 'checked',
        },
        'model.reducePercentage': {
            type: 'booleanAttribute',
            hook: 'reduction-type-percentage-input',
            name: 'checked',
        },
    },
    events: {
        // Simple events to update model from callbacks

        // events for: general
        'change [data-hook~=general-title-input]': function () {this.model.title = this.queryByHook( 'general-title-input' ).value;},
        'change [data-hook~=general-units-input]': function () {this.model.units = this.queryByHook( 'general-units-input' ).value;},
        'change [data-hook~=general-description-input]': function () {this.model.description = this.queryByHook( 'general-description-input' ).value;},

        // events for: type
        'click [data-hook~=type-continuous]': function () {this.model.type = 'continuous';},
        'click [data-hook~=type-categorial]': function () {this.model.type = 'categorial';},
        'click [data-hook~=type-spatial]': function () {this.model.type = 'spatial';},
        'click [data-hook~=type-time]': function () {this.model.type = 'time';},
        'click [data-hook~=type-network]': function () {this.model.type = 'network';},

        // events for: base-value
        'change [data-hook~=base-value-accessor-input]': function () {this.model.accessor = this.queryByHook( 'base-value-accessor-input' ).value;},
        'change [data-hook~=base-value-bccessor-input]': function () {this.model.bccessor = this.queryByHook( 'base-value-bccessor-input' ).value;},
        'change [data-hook~=base-value-missing-input]': function () {this.model.misval_astext = this.queryByHook( 'base-value-missing-input' ).value;},

        'click [data-hook~=base-value-kind-property]': function () {this.model.kind = 'property';},
        'click [data-hook~=base-value-kind-math]': function () {this.model.kind = 'math';},

        // events for: base-value-time
        'change [data-hook~=base-value-time-format-input]': function () {this.model.base_value_time_format = this.queryByHook( 'base-value-time-format-input' ).value;},
        'change [data-hook~=base-value-time-zone-input]': function () {this.model.base_value_time_zone = this.queryByHook( 'base-value-time-zone-input' ).value;},
        'change [data-hook~=base-value-time-reference-input]': function () {this.model.base_value_time_reference = this.queryByHook( 'base-value-time-reference-input' ).value;},

        'click [data-hook~=base-value-time-type-datetime-input]': function () {this.model.base_value_time_type = 'datetime';},
        'click [data-hook~=base-value-time-type-duration-input]': function () {this.model.base_value_time_type = 'duration';},

        // events for: transform
        'click [data-hook~=transform-continuous-none-input]': function () {this.model.transform = 'none';},
        'click [data-hook~=transform-continuous-percentiles-input]': function () {this.model.transform = 'percentiles';},
        'click [data-hook~=transform-continuous-exceedences-input]': function () {this.model.transform = 'exceedences';},

        'click [data-hook~=transform-categorial-rescan-button]': 'categoryRescan',
        'click [data-hook~=transform-categorial-addone-button]': 'categoryAddOne',
        'click [data-hook~=transform-categorial-removeall-button]': 'categoryRemoveAll',

        'change [data-hook~=transform-time-units-input]': function () {this.model.transform_time_units = this.queryByHook( 'transform-time-units-input' ).value;},
        'change [data-hook~=transform-time-zone-input]': function () {this.model.transform_time_zone = this.queryByHook( 'transform-time-zone-input' ).value;},
        'change [data-hook~=transform-time-reference-input]': function () {this.model.transform_time_reference = this.queryByHook( 'transform-time-reference-input' ).value;},

        'click [data-hook~=transform-time-none-input]': function () {this.model.transform = 'none';},
        'click [data-hook~=transform-time-timezone-input]': function () {this.model.transform = 'timezone';},
        'click [data-hook~=transform-time-todatetime-input]': function () {this.model.transform = 'todatetime';},
        'click [data-hook~=transform-time-toduration-input]': function () {this.model.transform = 'toduration';},

        // events for: grouping
        'change [data-hook~=grouping-general-minimum-input]': function () {this.model.minval_astext = this.queryByHook( 'grouping-general-minimum-input' ).value;},
        'change [data-hook~=grouping-general-maximum-input]': function () {this.model.maxval_astext = this.queryByHook( 'grouping-general-maximum-input' ).value;},

        'change [data-hook~=grouping-continuous-bins-input]': function () {this.model.grouping_continuous_bins = this.queryByHook( 'grouping-continuous-bins-input' ).value;},

        'click [data-hook~=grouping-continuous-fixedn-input]': function () {this.model.grouping_continuous = 'fixedn';},
        'click [data-hook~=grouping-continuous-fixedsc-input]': function () {this.model.grouping_continuous = 'fixedsc';},
        'click [data-hook~=grouping-continuous-fixeds-input]': function () {this.model.grouping_continuous = 'fixeds';},
        'click [data-hook~=grouping-continuous-log-input]': function () {this.model.grouping_continuous = 'log';},

        'change [data-hook~=grouping-time-format]': function () {this.model.grouping_time_format = this.queryByHook( 'grouping-time-format-input' ).value;},

        // events for: reduction
        'click [data-hook~=reduction-count-input]': function () {this.model.reduction = 'count';},
        'click [data-hook~=reduction-sum-input]': function () {this.model.reduction = 'sum';},
        'click [data-hook~=reduction-average-input]': function () {this.model.reduction = 'average';},

        'click [data-hook~=reduction-type-absolute-input]': function () {this.model.reduction_type = 'absolute';},
        'click [data-hook~=reduction-type-percentage-input]': function () {this.model.reduction_type = 'percentage';},
    },
    categoryRescan: function () {
        var dxcats = util.dxGetCategories(this.model);
        var categories = [];
        dxcats.forEach( function (d) {
            // NOTE: numbers are parsed: so not {key:'5', 20} but {key:5, value: 20}
            var key_as_string = d.key.toString();

            categories.push( {category: key_as_string, count: d.value, group: key_as_string} );
        });
        this.model.categories.reset(categories);
    },
    categoryRemoveAll: function () {
        this.model.categories.reset();
    }, 
    categoryAddOne: function () {
        var cat = new categoryItem();
        this.model.categories.add(cat);
    },
});
