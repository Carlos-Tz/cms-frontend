WRMCB=function(e){var c=console;if(c&&c.log&&c.error){c.log('Error running batched script.');c.error(e);}}
;
try {
/* module-key = 'com.atlassian.confluence.plugins.confluence-inline-tasks:space-page-picker-shim', location = 'js/space-page-picker-shim.js' */
define('confluence-inline-tasks/space-page-picker-shim',
[],
/**
 * This shim will be replaced by confluence-ui-components/js/space-page-picker in a future release of
 * confluence-ui-components, and can be removed then.
 */
function () {
    'use strict';

    // The 'values' single arg is preferred over an ordered arg list that might change in the future.
    function combineMapToString(values) {
        var spaceKeys = values.space;
        var pageIds = values.page;

        var typeAndKeys = [];

        if (spaceKeys) {
            typeAndKeys = typeAndKeys.concat(_.map(spaceKeys.split(','), function (spaceKey) {
                return 'space:' + spaceKey;
            }))
        }
        if (pageIds) {
            typeAndKeys = typeAndKeys.concat(_.map(pageIds.split(','), function (pageId) {
                return 'page:' + pageId;
            }))
        }

        return typeAndKeys.join(',');
    }

    function splitStringToMap(spageStr) {
        var values = {
            page: [],
            space: []
        };
        if (!spageStr) {
            return values;
        }

        var typeAndKeys = spageStr.split(',');
        typeAndKeys.forEach(function (typeAndKey) {
            var parts = typeAndKey.split(':');
            var type = parts[0];
            var key = parts[1];
            values[type].push(key);
        });

        return values;
    }

    function getValueAsMap(input) {
        return splitStringToMap(input.val());
    }

    return {
        // These two are just temporary wrappers so we go with the global hack for the time being.
        build: function (options) {
            return Confluence.UI.Components.SpacePagePicker.build(options);
        },
        setValue: function (value, input) {
            return Confluence.UI.Components.SpacePagePicker.setValue(value, input);
        },

        // These three functions will be provided in confluence-ui-components/js/space-page-picker soon.
        splitStringToMap: splitStringToMap,
        combineMapToString: combineMapToString,
        getValueAsMap: getValueAsMap
    };
});

}catch(e){WRMCB(e)};