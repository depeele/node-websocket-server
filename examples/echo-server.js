var sys = require("sys")
  , ws = require('../lib/ws');

var server = ws.createServer({debug: true});

server.addListener("listening", function(){
  sys.log("Listening for connections.");
});

// Handle WebSocket Requests
server.addListener("connection", function(conn){
  conn.send("Connection: "+conn.id);

  conn.addListener("message", function(message){
    server.broadcast("<"+conn.id+"> "+message);
  });
});

server.addListener("close", function(conn){
  server.broadcast("<"+conn.id+"> disconnected");
});

server.listen(8000);