/**
 * jquery.flot.LegendSelect.js
 *
 *  Flot Plugin for making plots selectable by transforming every legend label into buttons.
 *
 * When a legend is not selected it works by hiding the dataset. Setting series.data to an empty array.
 *
 * There are some speed optimizations built in that possibly could effect setting and other plugins.
 * However to get below 200 ms response time in IE8, it was necessary, a better solution to removing
 * auto generated config would be beneficial
 *
 * 	var _options = {
 * 		legend : {
 * 			selectable : false, // option to diable or enable plugin
 * 			selectableCallback : function() {
 * 			},
 * 			defaultSelected : ''
 * 		}
 * 	};
 *
 * Author: stkkj
 **/

(function($) {
    var _options = {
        legend : {
            selectable : false,
            selectableCallback : function() {
            },
            defaultSelected : ''
        }
    };

    function _isEnabled(options) {
        
        if(!options.legend)
            return false

        if(options.legend.selectable == false)
            return false
        
        return true;;
    };

    function _copy(obj) {
        var out = {};
        for (i in obj) {
            out[i] = obj[i];
        }
        return out;
    };

    function _copySeries(series) {
        var s = _copy(series);
        s.bars = _copy(series.bars);
        s.points = _copy(series.points);
        s.lines = _copy(series.lines);
        s.threshold = _copy(options.series.threshold);
        return s;
    };

    function _labelFormatter(lf, label, series) {
        if ( typeof lf == 'function')
            label = lf(label, series);
        if ( typeof lf == 'string')
            label = lf;
        return '<button class="AF_button">' + label + '</button>';
    };

    /*
     * speed hack!
     * pasing data is mush faster if default configuration is removed.
     * -------------- Potential cause for errors in specific configurations --------------
     */
    function _removeExtraInfo(series) {
        var s = series;
        delete s.datapoints;
        delete s.points;
        delete s.shadowSize;
        delete s.xaxis;

        s.datapoints = {};
        s.datapoints.points = [];
        if (s.yaxis.n)
            s.yaxis = s.yaxis.n;
            
        return s;
    }

    function _restoreSeries(seriesBackup, series) {

        if (seriesBackup[series.id])
            return seriesBackup[series.id];
        else {
            _replaceSeries(seriesBackup, series);
            //create backup
            return series;
        }
    }

    function _replaceSeries(seriesBackup, series) {
        if (!series.id) {
            series.id = Math.random()
            seriesBackup[series.id] = series;
        }

        return {
            data : [],
            id : series.id,
            label : series.label,
            threshold : {
                originSeries : series.threshold.originSeries,
                refSeries : series.threshold.refSeries
            }
        }
    }

    function _legendClickEvent(plot, event) {
        var label = event.target.innerHTML;
        var series = plot.getData();
        var preSelected = undefined;
        var index = 0;

        var seriesBackup = plot.getOptions().legend.selectable

        var yAxes = plot.getYAxes();
        for (var i = 0; i < yAxes.length; i++) {
            yAxes[i].options.show = false;
        }

        $('.Legend button').each(function(i, it) {
            it = $(it);
            if (it.html() == label) {
                it.removeClass('unSelected')
                index = i;
            } else if (!it.hasClass('unSelected')) {
                preSelected = it.html();
                it.addClass('unSelected');
            }
        });

        if (preSelected == undefined)
            return;
        // same button was clicked

        for (var i = 0; i < series.length; i++) {
            if (series[i].label == label || series[i].threshold.originSeries == label) {
                series[i] = _restoreSeries(seriesBackup, series[i]);
                series[i].bars.show = true;

                series[i] = _removeExtraInfo(series[i]);

                yAxes[series[i].yaxis - 1].options.show = true;

            } else if (series[i].threshold.refSeries == label) {
                series[i] = _restoreSeries(seriesBackup, series[i]);

                series[i].lines.show = true;
                series[i] = _removeExtraInfo(series[i]);
                yAxes[series[i].yaxis - 1].options.show = true;
            } else {
                series[i] = _replaceSeries(seriesBackup, series[i]);
            }

        };

        plot.getOptions().legend.defaultSelected = label;
        plot.setData(series);
        plot.setupGrid();
        plot.draw();

        bindEvents(plot, null, label);
    };

    // Prototype.js's curry function
    // http://api.prototypejs.org/language/Function/prototype/curry/
    function _curry(func) {
        if (!arguments.length || arguments.length <= 1)
            return func;
        var __method = func, args = Array.prototype.slice.call(arguments, 1);
        return function() {
            var a = $.merge([], args);
            $.merge(a, arguments);
            return __method.apply(this, a);
        }
    }

    function init(plot) {

        plot.hooks.processOptions.push(jQuery.proxy(processOptions, this));
    };

    function processOptions(plot, options) {
        if (_isEnabled(options)) {
            plot.hooks.bindEvents.push(jQuery.proxy(bindEvents, this));
            plot.hooks.processRawData.push(processRawData);
            options.legend.selectable = {};

            var lf = options.legend.labelFormatter;
            if (lf)
                options.legend.labelFormatter = _curry(_labelFormatter, lf);
            else
                options.legend.labelFormatter = _labelFormatter;
        }
    };

    function processRawData(plot, series, data, datapoints) {
        var defaultSelected = plot.getOptions().legend.defaultSelected;

        var columns = [series.label, series.rowsetColumn, series.threshold.originSeries, series.threshold.refSeries];

        var colDefaultSelected = columns.any(function(col) {
            return col == defaultSelected;
        });

        if (!colDefaultSelected) {
            datapoints.pointsize = 1;
            datapoints.points = [];
        } else {
            plot.getYAxes()[series.yaxis.n - 1].options.show = true;
        }

    };

    function bindEvents(plot, eventHolder, label) {
        var options = plot.getOptions();
        label = label ? label : options.legend.defaultSelected

        var buttons = jQuery('.Legend button');
        var div = buttons.closest('div');
        buttons.closest('table').hide();
        var elemns = [];
        jQuery(div).append(buttons);

        for (var i = 0; i < buttons.length; i++) {
            var button = $(buttons[i]);
            if (!label)
                label = button.html();

            if (button.html() != label)
                button.addClass('unSelected');

            button.bind('click', _curry(_legendClickEvent, plot));
        }

        plot.getOptions().legend.selectableCallback(label)
    };

    $.plot.plugins.push({
        init : init,
        options : _options,
        name : 'LegendSelect',
        version : '1.0'
    });

})(jQuery);
