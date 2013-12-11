/**
 * jquery.flot.MII_Rowset.js
 *
 * Flot Plugin for plotting JSON Rowset rows.
 * This plugin passes a MII transaction or query Rowset and plots a graph accordingly.
 *
 * Depends on the Flot.Categories plugin.
 *
 * General options
 *    MII : { //undefined disables plugin
 * 		rowset : undefined, //MII json rowset
 * 		xLabels : {
 * 				colName : undefined, // String or NULL, NULL is default and disables module, the column in the dataset to use for label
 * 			labelFormater : undefined, // null or function(label) return new label, null is default
 * 			MaxTicks : 8 // number, 8 is default
 * 		}
 * 	}
 *
 * Series options both general and on each
 *
 *    series : {
 * 			threshold : { //undefined disables thresholding
 * 				below : undefined, //column name of the column to use as target (will always be a line and black)
 * 			color : 'red' //colors of the bors below the threshold (see flot color documentation) defaults to red
 * 		}
 * 	}
 *
 * author: stkkj
 *
 * V1.01 Fixed a bug resulting in a large margin when using large datasets, and categories. (stkkj)
 *
 **/

(function ($) {
    var options = {
        MII: {// undefined disables
            rowset: undefined, //MII json rowset
            xLabels: {
                colName: undefined, // String or NULL, NULL is default and disables module
                labelFormater: undefined, // null or function(label) return new label, null is default
                MaxTicks: undefined // number, 8 is default
            }
        },
        series: {
            rowsetColumn: undefined, //column can either be here or as data.
            threshold: {
                below: undefined, //column name
                color: 'red',
                originSeries: undefined, //used internaly
                refSeries: undefined //used internaly
            }
        }

    };

    function _isEnabled(options) {
        if (options.MII && options.MII.rowset)
            return true;

        return false;
    }

    function _thressHoldEnabled(options) {
        if (options.series.threshold && options.series.threshold.below)
            return true;

        return false;
    }

    function _copy(obj) {
        var out = {};
        for (i in obj) {
            out[i] = obj[i];
        }
        return out;
    }

    function _copySeries(series) {
        var s = _copy(series);
        s.bars = _copy(series.bars);
        s.points = _copy(series.points);
        s.lines = _copy(series.lines);
        s.threshold = _copy(options.series.threshold);
        return s;
    }

    //Prototype String.times function
    var times = function (str, count) {
        return count < 1 ? '' : new Array(count + 1).join(str);
    }

    function _copyColumns(MII, series, colName) {
        var label;
        var rows = MII.rowset.rows;
        var skip = 0;
        if (MII.xLabels.MaxTicks != undefined) {
            skip = Math.ceil(rows.length / (MII.xLabels.MaxTicks ));
        }
        var j = 0;
        var dataBelow = [];

        series.data = [];
        var isSameColor = false;
        if (series.threshold.originSeries || series.threshold.refSeries || series.threshold.below == undefined || series.threshold.color == series.color) {
            var _series = [series];
            isSameColor = true;
        } else {
            var _series = [series, _copySeries(series)];
            _series[1].color = series.threshold.color;
            _series[1].label = '';
            _series[1].threshold.originSeries = series.label;
            _series[1].data = [];
            _series[1].yaxis.n = series.yaxis.n;

            if (!isNaN(series.threshold.below)) {
                _series.push(_copySeries(series));
                _series[2].bars.show = false;
                _series[2].label = '';
                _series[2].color = 'black';
                _series[2].threshold.originSeries = series.label;
                _series[2].data = [];
                _series[2].yaxis.n = series.yaxis.n;
                _series[2].lines.show = true;
            }
        }

        if (rows.length <= 0 || !jQuery.isNumeric(rows[0][colName]) )// no data
            return _series;

        for (var i = 0; i < rows.length; i++) {
            if (MII.xLabels.colName) {
                if (i % skip && colName) {
                    label = times(' ', j);
                    j++;
                } else if (MII.xLabels) {
                    label = rows[i][MII.xLabels.colName];
                }
            } else {
                label = new String(i);
            }

            var value = new Number(rows[i][colName]).valueOf();
            var value2 = rows[i][series.threshold.below];

            if (!isNaN(series.threshold.below))
                value2 = series.threshold.below;
            else if (!value2 || value2 == 'NA')
                value2 = Number.POSITIVE_INFINITY;

            if (isSameColor)
                value2 = Number.NEGATIVE_INFINITY;

            if (!series.threshold.below) {
                _series[0].data.push([label, value]);
            } else if (value < value2) {
                _series[1].data.push([label, value]);
                _series[0].data.push([label, -1]);
            } else {
                _series[0].data.push([label, value]);
                if (!isSameColor)
                    _series[1].data.push([label, -1]);
            }

            if (!isNaN(series.threshold.below)) {
                _series[2].data.push([label, series.threshold.below])
            }
        }
        ;
        if (series.threshold.refSeries) {
            var value = _series[0].data[_series[0].data.length - 1][1]
            var label = _series[0].data[_series[0].data.length - 1][0]

            if (typeof label == 'string')
                label = jQuery.trim(label);

            if (isNaN(new Number(label)) || label.length == 0) {
                label = '\n';
            } else {
                label++;
            }
            _series[0].data.push([label, value]);
        }
        if (!isNaN(series.threshold.below)) {
            _series[2].data.push(['\n', series.threshold.below])
        }

        return _series;
    }

    function _fixLabelLength(plot, series) {
        for (var i = 0; i < series.length; i++) {
            var data = series[i].data;
            var ctx = plot.getCanvas().getContext('2d');

            var f = plot.getXAxes()[0].options.font;
            ctx.save();
            ctx.font = '12px Arial';

            var width = 0;

            if(data.length <= 0 || data[0].length <= 0 || typeof data[0][0] != 'string')
                continue;

            for (var i = 0; i < data.length; ++i) {
                var t = data[i][0];

                var lines = t.replace(/<br ?\/?>|\r\n|\r/g, "\n").split("\n");

                if (t.strip() == "")
                    continue;

                for (var j = 0; j < lines.length; ++j) {
                    var line = lines[j];
                    var m = ctx.measureText(line);
                    var lineWidth = m.width;

                    if (lineWidth > width)
                        width = lineWidth;

                }
            }
        }

        ctx.restore();
        plot.getXAxes()[0].options.labelWidth = width;
    }

    //Runs the label formater
    function _applyLabel(lf, series) {
        var data = series.data;

        for (var i = 0; i < data.length; i++) {
            if (typeof data[i][0] == 'number') {
                data[i][0] = lf(new String(data[i][0]));
                var n = new Number(data[i][0])
                if (isNaN(n) == false)
                    data[i][0] = n.valueOf();

            } else {
                data[i][0] = lf(data[i][0]);
            }
        }

        series.data = data;
        return series;
    }

    function _createThresholdSeries(series, show) {
        var s = _copySeries(series);
        s.bars.show = false;
        s.points.show = false;
        s.lines.show = show;
        s.lines.steps = true;

        s.label = '';
        s.data = series.threshold.below;
        s.color = 'black';

        s.threshold.refSeries = series.label;
        s.threshold.below = undefined;
        return s;
    }

    function init(plot) {
        plot.hooks.processOptions.push(processOptions);
    };

    function processOptions(plot, options) {
        if (_isEnabled(options)) {
            plot.hooks.processRawData.push(processRawData);
            plot.hooks.drawBackground.push(processOffset);
        }
    }

    function processRawData(plot, series, data, datapoints) {
        if (!( typeof data == 'string'))// if not defined we have nothing to do
            return;

        // Make data into a propper array
        var MII = plot.getOptions().MII;

        series.rowsetColumn = data;

        if (series.threshold.below && isNaN(series.threshold.below)) {
            var show = (series.bars.show || series.lines.show || series.points.show);
            var rows = MII.rowset.rows;

            for (var i = 0; i < rows.length; i++) {

                var value = new Number(plot.getOptions().MII.rowset.rows[i][series.threshold.below]);

                if (isNaN(value)) {
                    delete series.threshold.below;
                    //Invalid data in dataset, disable thresshold.
                    break;
                }
            }

            if (series.threshold.below)
                plot.getData().push(_createThresholdSeries(series, show));
        }

        if (series.label === undefined)
            series.label = series.rowsetColumn;

        var _series = _copyColumns(MII, series, series.rowsetColumn);
        //Remove the last data-point for the threshold line, to make it not exceed the width of the bars
        if (_series[2]) {
            _series[2].data.splice(_series[2].data.length - 1, 1);
        }
        if (MII.xLabels.labelFormater) {
            for (var i = 0; i < _series.length; i++) {
                _series[i] = _applyLabel(MII.xLabels.labelFormater, _series[i]);
            }
            ;
        }

        _fixLabelLength(plot, _series);

        series.data = _series[0].data;
        for (var i = 1; i < _series.length; i++) {
            plot.getData().splice(0, 0, _series[i]);
        }
    }

    function processOffset(plot, canvascontext, series) {
        var xAxes = plot.getXAxes();
        for (var i = 0; i < xAxes.length; i++) {

            for (var j = 0; j < xAxes[i].ticks.length; j++) {
                var tick = xAxes[i].ticks[j];

                if (tick.label.strip() == "")
                    tick.width = 0;
            }
        }
    }


    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'MII_rowset',
        version: '1.0'
    });

})(jQuery);
