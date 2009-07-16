var xing = xing || {};
xing.bikinibottom = xing.bikinibottom || {};

xing.bikinibottom.SocialData = {
  STORAGE_DELIMITER: "-|--|-",
  
  getOwner: function(callback, forceLoading) {
    callback = callback || function() {};
    
    if (this._friends && !forceLoading) {
      return callback(this._owner);
    }
    
    var req, ownerSpec;
    
    req = opensocial.newDataRequest();
    ownerSpec = opensocial.IdSpec.PersonId.OWNER;
    req.add(req.newFetchPersonRequest(ownerSpec), "owner");
    req.send(function(data) {
      if (data.hadError()) {
        return console.log("error loading owner... w000t!");
      }
      
      this._owner = data.get("owner").getData();
      
      callback(this._owner);
    }.bind(this));
  },
  
  getOwnerFriends: function(callback, forceLoading) {
    callback = callback || function() {};
    
    if (this._friends && !forceLoading) {
      return callback(this._friends);
    }
    var req, friendsSpec, index, friendsCount, data;
    
    index = 0;
    this._friends = [];
    
    var getFriends = function() {
      req = opensocial.newDataRequest();

      friendsSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "FRIENDS" });
      friendsParams = {};
      friendsParams[opensocial.DataRequest.PeopleRequestFields.FIRST] = index;
      friendsParams[opensocial.DataRequest.PeopleRequestFields.MAX] = 50;

      req.add(req.newFetchPeopleRequest(friendsSpec, friendsParams), "friends");
      req.send(function(data) {
        if (data.hadError()) {
          return console.log("error loading friends... w000t!");
        }
        
        data = data.get("friends").getData();
        friendsCount = friendsCount || data.getTotalSize();
        
        this._friends = this._friends.concat(data.asArray());
        
        if (this._friends.length >= friendsCount || this._friends.length >= 200) {
          $(document.body).setStyle({ cursor: "" });
          callback(this._friends);
        } else {
          index += 50;
          getFriends();
        }
      }.bind(this));
    }.bind(this);
    
    getFriends();
    
    $(document.body).setStyle({ cursor: "wait" });
  },
  
  // Returns all messages that belong to the owner, sorted by date
  getSentMessages: function(callback, forceLoading) {
    callback = callback || function() {};
    
    if (this._sentMessages && !forceLoading) {
      return callback(this._sentMessages);
    }
    
    var req, ownerSpec, message, messages, sentMessagesJson, sentMessages, i;
    
    req = opensocial.newDataRequest();
    ownerSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "SELF" });
    
    req.add(req.newFetchPersonAppDataRequest(ownerSpec, "*"), "messages");
    req.send(function(data) {
      if (data.hadError()) {
        return console.log("error retrieving messages... w000t!");
      }
      
      messages = data.get("messages").getData();
      xing.bikinibottom.SocialData.getOwner(function(owner) {
        sentMessages = [];
        sentMessagesJson = messages[owner.getId()];
        for (id in sentMessagesJson) {
          message = gadgets.util.unescapeString(sentMessagesJson[id]);
          message = gadgets.json.parse(message);
          
          message = Object.extend(message, {
            id: id,
            date: new Date(message.timestamp).toGMTString()
          });
          sentMessages.push(message);
        }
        
        // Sort by date
        this._sentMessages = sentMessages.sortBy(function(message) {
          return message.timestamp || 0;
        }).reverse();
        callback(this._sentMessages);
      }.bind(this));
    }.bind(this));
  },
  
  // Returns all messages that belong to the owner, sorted by date
  getReceivedMessages: function(callback, forceLoading) {
    callback = callback || function() {};
    
    if (this._receivedMessages && !forceLoading) {
      return callback(this._receivedMessages);
    }
    
    var req, ownerSpec, message, messages_by_sender,
      receivedMessagesJson, receivedMessages, i;
    
    req = opensocial.newDataRequest();
    ownerSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "FRIENDS" });
    
    req.add(req.newFetchPersonAppDataRequest(ownerSpec, "*"), "messages");
    req.send(function(data) {
      if (data.hadError()) {
        return console.log("error retrieving messages... w000t!");
      }
      
      messages_by_sender = data.get("messages").getData();
      xing.bikinibottom.SocialData.getOwner(function(owner) {
      receivedMessages = [];
      for (sender in messages_by_sender) {
        messages_by_id = messages_by_sender[sender];
        for (message_id in messages_by_id) {
          message = messages_by_id[message_id];
          message = gadgets.util.unescapeString(message);
          message = gadgets.json.parse(message);
          
          message = Object.extend(message, {
            id: message_id,
            date: new Date(message.timestamp).toGMTString()
          });
          if (message.recipient == owner.fields_.id) {
            receivedMessages.push(message);
          }
        }
      }
      // Sort by date
      this._receivedMessages = receivedMessages.sortBy(function(message) {
        return message.timestamp;
      }).reverse();
      
      callback(this._receivedMessages);
      }.bind(this));      
    }.bind(this));
  },
  
  getReadMessages: function(callback, forceLoading) {
    callback = callback || function() {};
    
    if (this._readMessages && !forceLoading) {
      return callback(this._readMessages);
    }
    
    var req, ownerSpec, readMessages;
    
    req = opensocial.newDataRequest();
    ownerSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "SELF" });
    
    req.add(req.newFetchPersonAppDataRequest(ownerSpec, "read_messages"), "read_messages");
    req.send(function(data) {
      if (data.hadError()) {
        return console.log("error retrieving read messages... w000t!");
      }
      
      var readMessages = data.get("read_messages").getData();
      xing.bikinibottom.SocialData.getOwner(function(owner) {
        readMessages = readMessages[owner.getId()];
        if (readMessages) {
          readMessages = readMessages["read_messages"];
          readMessages = readMessages && gadgets.util.unescapeString(readMessages);
        }
        
        this._readMessages = readMessages ? readMessages.split("-|--|-") : [];
        callback(this._readMessages);
      }.bind(this));
    }.bind(this));
  },
  
  setReadMessages: function(readMessages, callback) {
    var req, ownerSpec, readMessages;
    
    readMessages = readMessages.join(this.STORAGE_DELIMITER);
    callback = callback || function() {};
    
    req = opensocial.newDataRequest();
    ownerSpec = opensocial.IdSpec.PersonId.OWNER;
    
    req.add(req.newUpdatePersonAppDataRequest(ownerSpec, "read_messages", readMessages), "read_messages");
    req.send(function(data) {
      if (data.hadError()) {
        return console.log("error saving read messages... w000t!");
      }
      
      callback();
    });
  },
  
  sendPrivateMessage: function(recipient, subject, body, callback) {
    var params, message;
    
    callback = callback || function() {};
    
    params = {};
    params[opensocial.Message.Field.TYPE] = opensocial.Message.Type.PRIVATE_MESSAGE;
    params[opensocial.Message.Field.TITLE] = subject;
    
    // Convert to array
    recipient = [recipient];
    
    message = opensocial.newMessage(body, params);
    
    // Ok, send!
    opensocial.requestSendMessage(recipient, message, callback);
  }
};