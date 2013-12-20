
var restify = require('restify');
var fs = require('fs');

var dataAccel = {
    "X":[],
    "Y":[],
    "Z":[]
  };
  
var dataAccelMeanBuffers = {
	
}
var dataAccelMean = {
    "X":[0],
    "Y":[0],
    "Z":[0]
};

var dataGyro = {
    "X":[],
    "Y":[],
    "Z":[]
  };
var packageNumber = 0;

var slice = Array.prototype.slice;

  function update(array, args) {
    var arrayLength = array.length, length = args.length;
    while (length--) array[arrayLength + length] = args[length];
    return array;
  }

function merge(array, args) {
    array = slice.call(array, 0);
    return update(array, args);
  }

Function.prototype.curry =  function() {
    if (!arguments.length) return this;
    var __method = this, args = slice.call(arguments, 0);
    return function() {
      var a = merge(args, arguments);
      return __method.apply(this, a);
    }
  }

function saveData(path, req, res, next){
  
  function saveFile(){
	  var time = Date.now()
	  
		
		var dataStr = JSON.stringify(req.body);
		
			
		fs.writeFile(path + "/SimFall_" + time + ".js", dataStr, function(err){
		  console.log(written + " bytes of data written.");
		});

  }
  
  console.log('Saveing data: ' + path);
  fs.exists(path, function(exists){
		if(!exists)
			fs.mkdir(path, saveFile)  ;
		else
			saveFile();
	});
  res.send()
  return next();
}

function getSavedData(path, req, res, next){
 var files = fs.readdirSync(path);
 
 var dataObj = {};
 for(var i = 0; i < files.length; i++){
     var name = files[i].split('.')[0];
	 dataObj[name] = fs.readFileSync(path + "/" + files[i], 'utf8');	 
 }
 
 
 res.send(dataObj);
}


function appendData(data, req, res, next) {
	
  if(data == dataAccel)
	  appendMeanData(dataAccelMean, req, res, next)	;
  
  data.X = data.X.concat(req.body.X);
  data.Y = data.Y.concat(req.body.Y);
  data.Z = data.Z.concat(req.body.Z);
  
  var BUFFER_SIZE = 200;
  if(data.X.length > BUFFER_SIZE){
    data.X = data.X.slice(data.X.length- BUFFER_SIZE, data.X.length);
    data.Y = data.Y.slice(data.Y.length- BUFFER_SIZE, data.Y.length),
    data.Z = data.Z.slice(data.Z.length- BUFFER_SIZE, data.Z.length);
  }
  
  res.send(['ok']);
  console.log('Data appended: ' + packageNumber);
  packageNumber++;
  return next();
};

function appendMeanData(dataAccelMean, req, res, next){

	var BUFFER_SIZE_MEAN = 100;
	var dataInput = req.body;
		
	for(var lbl in dataAccelMean){
		var data = dataAccelMean[lbl];
		if(typeof dataAccelMeanBuffers[lbl] == 'undefined'){
			dataAccelMeanBuffers[lbl] = {};
			dataAccelMeanBuffers[lbl].buffer = [];
			for(var i = 0; i < BUFFER_SIZE_MEAN; i++)
				dataAccelMeanBuffers[lbl].buffer.push(dataInput[lbl][0]);

			dataAccelMeanBuffers[lbl].iBuffer = 0;
		}

		var buffer = dataAccelMeanBuffers[lbl].buffer;
		
		
		for(var i = 0; i < dataInput[lbl].length; i++){
			var y = 0;		
			var newY = dataInput[lbl][i];

			buffer[dataAccelMeanBuffers[lbl].iBuffer] = newY
			
			for(var j = 0; j < BUFFER_SIZE_MEAN; j++){
				y += buffer[j];
			}
			
			y = y / BUFFER_SIZE_MEAN;
			
			if(!Number.isNaN(y))
				data.push(y);
				
			dataAccelMeanBuffers[lbl].iBuffer++;
			
			if(dataAccelMeanBuffers[lbl].iBuffer >= BUFFER_SIZE_MEAN){
				dataAccelMeanBuffers[lbl].iBuffer = 0;
			}
		}		
	}
	
  var data = dataAccelMean;
  var BUFFER_SIZE = 200;
  if(data.X.length > BUFFER_SIZE){
    data.X = data.X.slice(data.X.length- BUFFER_SIZE, data.X.length);
    data.Y = data.Y.slice(data.Y.length- BUFFER_SIZE, data.Y.length);
    data.Z = data.Z.slice(data.Z.length- BUFFER_SIZE, data.Z.length);
  }
}

function getData(data, req, res, next) {
  res.send(data);  
  return next();
};

var server = restify.createServer();

server.use(restify.queryParser( {mapParams: false} ));
server.use(restify.bodyParser());

server.get('/accel', getData.curry(dataAccel));
server.get('/accelMean', getData.curry(dataAccelMean));
server.head('/accel', getData.curry(dataAccel));
server.post('/accel', appendData.curry(dataAccel));

server.get('/gyro', getData.curry(dataGyro));
server.head('/gyro', getData.curry(dataGyro));
server.post('/gyro', appendData.curry(dataGyro));


server.post('/accel/saved', saveData.curry('./accel'));
server.get('/accel/saved', getSavedData.curry('./accel'));

server.get(/.html/, function(req, res, next){
	var filePath = req.url.substring(1);
	
	var file = fs.readFileSync(filePath, 'utf8');
	res.setHeader('Content-Type', 'text/html');
	res.end(file);
	return next();
});

server.get(/.js/, function(req, res, next){
	var filePath = req.url.substring(1);
	
	var file = fs.readFileSync(filePath, 'utf8');
	res.setHeader('Content-Type', 'text/javascript');
	res.end(file);
	return next();
});


server.listen(80, function() {
  console.log('%s listening at %s', server.name, server.url);
});
