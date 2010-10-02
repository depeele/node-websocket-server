/*-----------------------------------------------
  Requirements:
-----------------------------------------------*/
var sys    = require("sys")
  , http   = require("http")
  , events = require("events")
  , path   = require("path");

require.paths.unshift(__dirname);

var Manager = require("ws/manager")
  , Connection = require("ws/connection");


/*-----------------------------------------------
  Mixin:
-----------------------------------------------*/
var mixin = function(target, source) {
  for(var i = 0, keys = Object.keys(source), l = keys.length; i < l; ++i) {
    if(source.hasOwnProperty(keys[i])){
      target[keys[i]] = source[keys[i]];
    }
  }
  return target;
};

/*-----------------------------------------------
  WebSocket Server Exports:
-----------------------------------------------*/
exports.Server = Server;
exports.createServer = function(options){
  return new Server(options);
};

exports._Manager = Manager;
exports._Connection = Connection;

/*-----------------------------------------------
  WebSocket Server Implementation:
-----------------------------------------------*/

function Server(options){
  var ws = this;

  events.EventEmitter.call(this);

  this.options = mixin({
    debug: false,         // Boolean:       Show debug information.
    server: new http.Server()
  }, options || {});

  this.manager = new Manager(this.options.debug);
  this.server  = this.options.server;
  this.debug   = this.options.debug;

  if(this.options.datastore){
    console.error("Built-in DataStore has been removed, please refer to http://github.com/miksago/nws-memstore");
  }

  this.server.addListener("upgrade", function(req, socket, upgradeHead){
    if( req.method == "GET" && ( "upgrade" in req.headers && "connection" in req.headers) &&
        req.headers.upgrade.toLowerCase() == "websocket" && req.headers.connection.toLowerCase() == "upgrade"
    ){
      // create a new connection, it'll handle everything else.
      new Connection(ws.manager, req, socket, upgradeHead, ws.options);
    } else {
      // Close the socket, it wasn't a valid connection.
      socket.end();
      socket.destroy();
    }
  });
  
  this.manager.addListener("connection", function(conn){
    ws.emit("connection", conn);
  });
  
  this.manager.addListener("timeout", function(conn){
    ws.emit("timeout", conn);
  });
  
  this.manager.addListener("error", function(conn){
    ws.emit("error", conn);
  });
  
  this.manager.addListener("close", function(conn){
    ws.emit("close", conn);
  });
  
  this.server.addListener("connection", function(socket){
    socket.setTimeout(0);
    socket.setNoDelay(true);
    socket.setKeepAlive(true, 0);
  });

  this.server.addListener("listening", function(req, res){
    ws.emit("listening");
  });

  this.server.addListener("close", function(errno){
    ws.emit("shutdown", errno);
  });

  this.server.addListener("request", function(req, res){
    ws.emit("request", req, res);
  });

  this.server.addListener("stream", function(stream){
    ws.emit("stream", stream);
  });

  this.server.addListener("clientError", function(e){
    ws.emit("clientError", e);
  });
};

sys.inherits(Server, events.EventEmitter);

/*-----------------------------------------------
  Public API
-----------------------------------------------*/
Server.prototype.setSecure = function (credentials) {
  this.server.setSecure.call(this.server, credentials);
}

Server.prototype.listen = function(){
  this.server.listen.apply(this.server, arguments);
};

Server.prototype.close = function(){
  this.server.close();
};

Server.prototype.send = function(id, data){
  this.manager.find(id, function(client){
    if(client && client._state === 4){
      client.write(data);
    }
  });
};

Server.prototype.broadcast = function(data){
  this.manager.forEach(function(client){
    if(client && client._state === 4){
      client.write(data);
    }
  });
};

Server.prototype.use = function(module){
  module.call(this, this.options);
};

