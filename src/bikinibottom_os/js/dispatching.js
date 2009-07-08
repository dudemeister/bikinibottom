function DispatchingSystem(server, user_auth_token, user_id) {
  // this.socket = socket;
  this.server = server;
  this.user_auth_token = user_auth_token;
  this.user_id = user_id;
  this.createSocket();
}
   
DispatchingSystem.prototype = {
  
  // todo: create socket doesn't look as good as it should/could ;)
  "createSocket": function() {
    var socket = $('<!-- MESSAGING SOCKET --><object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=8,0,0,0" width="1" height="1" align="middle"><param name="allowScriptAccess" value="sameDomain"><param name="movie" value="http://localhost:8080/socket.swf"><param name="quality" value="high"><param name="bgcolor" value="#FFFFFF">        <embed id="flash_socket" src="http://localhost:8080/socket.swf" quality="high" bgcolor="#FFFFFF" width="20" height="20" name="flash_socket" align="middle" allowScriptAccess="sameDomain" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer">    </object><!-- END OF MESSAGING SOCKET -->');
    console.log(socket);
    $('body').append(socket);
    this.socket = document.getElementById('flash_socket');
  },
  
  "socketReadyCallback": function() {
    console.log('socket ready, trying to establish connection');
    // todo fix this, it is double done, was needed for safari
    // for some reasons the this.socket didn't behave as if it
    // was the flash socket
    this.socket = document.getElementById('flash_socket')
    this.connectSocket();
    $(window).bind('beforeunload', function(){
      this.socket.close()
    })
  },
    
  "connectSocket": function() {
    this.socket.connectSocket(this.server);
  },
  
  "socketConnectCallback": function(args) {
    console.log('connection established? ' + args);
    // doing this because a new socket has been opened after the initial opening (flash does that for policy handling) 
    // and the first response is a policy response by default
    this.sendMessage('foo', true);
    this.authenticateUser();
  },

  "authenticateUser": function() {
    this.sendMessage('auth_response:' + '{"user_id":' + this.user_id + ', "token":"' + this.user_auth_token + '"}');
  },

  // destination_id is your key for eventmachine/js communication
  // e.g. eventmachine sends an destination_id with each message
  // and the dispatcher finds the correct destination for this
  "addRecipient": function(destination_id, recipient_object) {
  
  },

  // maybe not needed will see
  "removeRecipient": function(destination_id) {
  
  },

  "findDestination": function(data) {

  },

  "messageReceived": function(raw_data) {
    console.log(raw_data + ' wurde empfangen.');
    
    // make it a first class object
    eval("var message = " + raw_data);
    
    switch(message.x_target) {
      // special case: on initial successful connection this sets the socket_id
      // to the message form
      // todo: needs to be set globally
      case "socket_id":
        $('#tweet_socket_id').val(message.socket_id);
        break;
      default:
        console.log('default handling: ' + message.x_target + '(message)');
        eval(message.x_target + '(message)');
    }
  },

  "parseMessage": function(data) {
  
  },

  "sendMessage": function(data, delimit) {
    console.log('Versuche ' + data + ' zu senden.');
    if(delimit) {
      data = data + "\0"
    }
    this.socket.sendData(data);
  },

  "dispatch": function(to, data) {
    // ;)
    to(data);
  },
  
  "test": function(args) {
    console.log('dispatcher called test');
  }
  
};