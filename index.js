var restify = require('restify');

var dataAccel = {
    "X":[],
    "Y":[],
    "Z":[]
  };
  
  
 var dataGyro = {
    "X":[],
    "Y":[],
    "Z":[]
  };
var i = 0;

function storeData(data, req, res, next) {
  dataAccel = req.body;
  res.send('ok');
//  console.log('Data recived: ' + JSON.stringify(dataAccel));
  return next();
};

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

function appendData(data, req, res, next) {
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
  console.log('Data appended: ' + i);
  i++;
  return next();
};


function getData(data, req, res, next) {
  res.send(data);  
//  console.log('Data sent: ' + JSON.stringify(data));
	if(i == -1)
		appendData();
  return next();
};

var server = restify.createServer();

server.use(restify.queryParser( {mapParams: false} ));
server.use(restify.bodyParser());

server.get('/accel', getData.curry(dataAccel));
server.head('/accel', getData.curry(dataAccel));

server.post('/accel', appendData.curry(dataAccel));
server.put('/accel', storeData.curry(dataAccel));

server.get('/gyro', getData.curry(dataGyro));
server.head('/gyro', getData.curry(dataGyro));

server.post('/gyro', appendData.curry(dataGyro));
server.put('/gyro', storeData.curry(dataGyro));


// server.del('hello/:name', function rm(req, res, next) {});


server.listen(8081, function() {
  console.log('%s listening at %s', server.name, server.url);
});