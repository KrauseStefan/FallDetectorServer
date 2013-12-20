/*********************************
 Name:           ArlaDialogDirective.js
 By:             stkkj

 Description:

 Version:  Date:        Comment:
 1.2       08-08-2013   Added exceptions added form cleanup (stkkj)
 1.1       08-08-2013   Added exceptions when not configured correctly (stkkj)
 1.0       10-06-2013   Initial version

 *********************************/
'use strict';
angular.module('FallDetector').directive('afDialog', function factory($document, $window, $timeout) {
    var body = angular.element($document[0].body);

    var handledEscapeKey = null;


    function mesureElement(element) {
        var height = parseFloat(element[0].clientHeight);
        var width = parseFloat(element[0].clientWidth);

        if (height > 0 && width > 0) {
            return {
                height: height,
                width: width
            }
        }

    }

    var directiveDefinitionObject = {
        template: '<div>' +
            '   <div ng-show="show" class="AF_modalFrame" ng-click="_close()" style="position: fixed;"></div>' +
            '   <div ng-Transclude class="AF_modal" ng-style="positionStyle" style="padding: 3px; box-shadow: 10px 5px 5px #888; position: fixed; display: block; overflow-y: visible;"> </div>' +
            '</div>',
        transclude: true,
        restrict: 'EA',
        scope: {
            show: '=',
            close: '&',
            options: '&'
        },
        compile: function compile(tElement, tAttrs, transclude) {


            return function link(scope, iElement, iAttrs, controller) {
                scope.elementFrame = angular.element(iElement.children().children()[1]);

                var childScope = scope.$new();
                if (angular.isUndefined(iAttrs.show) || angular.isUndefined(iAttrs.close))
                    throw new Error("show and close attribute must be defined on the \"af-dailog\" directive!");

//                transclude(childScope, function (clone, innerScope) {
//                    var element = clone;
//                    if (element.length > 0) {
//                        element = angular.element('<div>').append(element);
//                        element.css({
//                            position: 'absolute',
//                            display: 'block',
//                            visibility: 'hidden'
//                        });
//                        body.append(element);
//                    }
//
//                    if (angular.isString(element)) {
//                        console.log('afDialogDirective.js: limited support for text strings');
//                        return;
//                    }
//
//                    element.remove();
//
//                    //later mesurements for iframs
////                    if (clone[0].tagName == 'IFRAME') {
////                        clone.on('load', function () {
////
////                        });
////                    }
//                });

                //imppement onresize event

                handledEscapeKey = function (event) {
                    if (event.which === 27) {
                        scope.$apply(function () {
                            scope._close();
                            event.preventDefault();
                        });
                    }
                };
                body.on('keydown', handledEscapeKey);

                var timerRunning = false;
                angular.element($window).on('resize', function () {
                    if (scope.show && !timerRunning) {
                        timerRunning = true;
                        $timeout(function () {
                            scope.elementDimensions = mesureElement(scope.elementFrame);
                            timerRunning = false;
                        }, 300);
                    }
                })

            };
        },

        controller: function controller($scope, $document) {

            var DEDAULT_HIDE_STYLE = {
                top: '-9999px',
                left: '-9999px'
            };

            var position = {}

            $scope.positionStyle = angular.copy(DEDAULT_HIDE_STYLE);

            $scope.$watch('show', function (value) {
                if (value) {
                    $scope.elementDimensions = mesureElement($scope.elementFrame);
                } else {
                    $scope.positionStyle = angular.copy(DEDAULT_HIDE_STYLE);
                }
            });

            $scope.$watch('elementDimensions', function (dimensions) {
                if (dimensions && $scope.show) {
                    $scope.positionStyle.top = ($document[0].documentElement.clientHeight / 2 - dimensions.height / 2) + 'px';
                    $scope.positionStyle.left = ($document[0].documentElement.clientWidth / 2 - dimensions.width / 2) + 'px';
                }
            });


            $scope._close = function () {
                body.unbind('keydown', handledEscapeKey);
                var closeFuncRtn = $scope.close();
            }
        }
    };
    return directiveDefinitionObject;
});