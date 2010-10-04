var sys    = require("sys")
  , events = require("events")
  , http = require("http")
  , wss = require("websocket-server");

var Connection = wss._Connection
  , Manager = wss._Manager;

function CustomServer(){
  events.EventEmitter.call(this);
  
  this.options = {
    debug: true,         // Boolean:       Show debug information.
    version: "auto",      // String:        Value must be either: draft75, draft76, auto
    origin: "*",          // String, Array: A match for a valid connection origin
    subprotocol: "*"     // String, Array: A match for a valid connection subprotocol.
  };
  
  this.manager = new Manager(this.options.debug);
  this.server  = new http.Server();
  this.debug   = this.options.debug;
  
  var cs = this;
  
  this.server.addListener("upgrade", function(req, socket, upgradeHead){
    new Connection(cs, req, socket, upgradeHead);
  });
};

sys.inherits(CustomServer, events.EventEmitter);


var server = new CustomServer();
server.server.listen.apply(server.server, [8080]);
