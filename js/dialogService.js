/*********************************
 Name:           ArlaDialogService.js
 By:             stkkj
 Version:        1.0                 Date: 08-08-2013

 Description:
 *  Does not support multiple dialogs
 *
 *  showMsg(String text) -- show a info message to the user
 *  askMsg(String text[, Object Settings]) -- show a dialog message to the user (yes / no) style

 Version:  Date:        Comment:
 1.0       10-06-2013   Initial version (stkkj)
 1.1       15-08-2013   added multiple line support

 *********************************/

angular.module('FallDetector').provider('dialog', function () {


    //Variables for translation
    this.yes = "Yes";
    this.no = "No";


    this.$get = function ($compile, $rootScope, $q, $document) {
        var yes = this.yes;
        var no = this.no;
        var element;
        var defered;

        var scope = $rootScope.$new(true);
        scope.show = false;

        scope.closeResolve = function () {
            $document[0].body.removeChild(element[0]);
            element = null;
            scope.show = false;
            defered.resolve();
        };
        scope.closeReject = function () {
            $document[0].body.removeChild(element[0]);
            element = null;
            scope.show = false;
            defered.reject();
        };

        function getBaseElement() {
            var elem = angular.element(document.createElement('div'));
            elem.attr('show', 'show');
            return elem;
        }

        function parseForNewlineAndAppend(elem, content) {
            content = content.replace('<br>', '\n').split(/\n/);

            for (var i = 0; i < content.length; i++) {
                if (i != 0)
                    elem.append('<br>');
                var htmlInner = angular.element('<p>');
                htmlInner.css({'text-align': 'center'});
                htmlInner.html(content[i]);
                elem.append(content[i]);
            }
            return elem;
        }

        var afDialogProvider = {
            showMsg: function (anyNumberOfArguments) {
                var _arguments = [];
                for (var i = 0; i < arguments.length; i++) {
                    _arguments.push($q.when(arguments[i]));
                }

                return $q.all(_arguments).then(function (content) {
                    "use strict";
                    content = content.join("");
                    if (angular.isElement(element))
                        throw "Already open dialog, it must be closed first";
                    defered = $q.defer();

                    var elem = getBaseElement();
                    elem.attr('close', 'closeResolve()');
                    parseForNewlineAndAppend(elem, content);

                    element = elem;
                    $document[0].body.appendChild(element[0]);

                    elem.attr('af_dialog', ''); // must be applied after innerHTML has been updated

                    $compile(elem)(scope);//($rootScope);


                    scope.show = true;
                    return defered.promise;
                });
            },

            askMsg: function (anyNumberOfArguments) {
                var _arguments = [];
                for (var i = 0; i < arguments.length; i++) {
                    _arguments.push($q.when(arguments[i]));
                }

                return $q.all(_arguments).then(function (content) {
                    content = content.join("");
                    if (angular.isElement(element))
                        throw "Already open dialog, it must be closed first";
                    defered = $q.defer();

                    var buttons = angular.element('<div>');

                    buttons.css({textAlign: 'center'});

                    var btnYes = angular.element('<button>');
                    btnYes.text(yes);
                    btnYes.css({margin: '5px'});
                    btnYes.attr('ng-click', 'closeResolve()');
                    btnYes.addClass("AF_button");

                    var btnNo = angular.element('<button>');
                    btnNo.text(no);
                    btnNo.css({margin: '5px'});
                    btnNo.attr('ng-click', 'closeReject()');
                    btnNo.addClass("AF_button");

                    buttons.append(btnYes);
                    buttons.append(btnNo);

                    var elem = getBaseElement();
                    parseForNewlineAndAppend(elem, content);

                    elem.append(buttons);
                    elem.attr('close', 'closeReject()');

                    elem.attr('af_dialog', '');

                    element = elem;
                    $document[0].body.appendChild(element[0]);
                    $compile(elem, buttons)(scope);//($rootScope);

                    scope.show = true;
                    return defered.promise;
                });
            }

        }

        return afDialogProvider;
    }
});

