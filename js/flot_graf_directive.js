

angular.module('FallDetector').directive('flotGraf', function factory($document, $window, $timeout) {

	return {
        template: '<div><div>',
        transclude: false,
        restrict: 'EA',
        scope: {
			data: '=',
			options: '='
		},
		link: function link(scope, element, attrs){

//    		var element = element.find('div');
	        
	        scope.$watch('data', function(data){
			jQuery.plot(element, data, scope.options);		
                
            });
	        
			element.css({
                display: 'block'
//                width: '500px',
//                height: '500px'
            });

			
		}
	
	};


})
