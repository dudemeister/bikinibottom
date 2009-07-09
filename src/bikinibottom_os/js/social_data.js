var xing = xing || {};
xing.bikinibottom = xing.bikinibottom || {};

xing.bikinibottom.SocialData = {
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
        return alert("error loading owner... w000t!");
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
    var req, friendsSpec;
    req = opensocial.newDataRequest();
    
    friendsSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "FRIENDS" });
    friendsParams = {};
    friendsParams[opensocial.DataRequest.PeopleRequestFields.MAX] = 100;
    
    req.add(req.newFetchPeopleRequest(friendsSpec, friendsParams), "friends");
    req.send(function(data) {
      if (data.hadError()) {
        return alert("error loading friends... w000t!");
      }
      
      this._friends = data.get("friends").getData();
      callback(this._friends);
      
    }.bind(this));
  },
  
  // Returns all messages that belong to the owner, sorted by date
  getSentMessages: function(callback, forceLoading) {
    callback = callback || function() {};
    
    if (this._sentMessages && !forceLoading) {
      callback(this._sentMessages);
    }
    
    var req, ownerSpec, message, messages, sentMessagesJson, sentMessages, i;
    
    req = opensocial.newDataRequest();
    ownerSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "SELF" });
    
    req.add(req.newFetchPersonAppDataRequest(ownerSpec, "*"), "messages");
    req.send(function(data) {
      if (data.hadError()) {
        return alert("error retrieving messages... w000t!");
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
      }.bind(this));
      // Sort by date
      sentMessages = sentMessages.sortBy(function(message) {
        return message.timestamp;
      }).reverse();
      
      callback(sentMessages);
    }.bind(this));
  },
  
  // Returns all messages that belong to the owner, sorted by date
  getReceivedMessages: function(callback, forceLoading) {
  	callback = callback || function() {};
    
    if (this._receivedMessages && !forceLoading) {
      callback(this._receivedMessages);
    }
    
    var req, ownerSpec, message, messages_by_sender,
      receivedMessagesJson, receivedMessages, i;
    
    req = opensocial.newDataRequest();
    ownerSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "FRIENDS" });
    
    req.add(req.newFetchPersonAppDataRequest(ownerSpec, "*"), "messages");
    req.send(function(data) {
      if (data.hadError()) {
        return alert("error retrieving messages... w000t!");
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
      receivedMessages = receivedMessages.sortBy(function(message) {
        return message.timestamp;
      }).reverse();
      
      callback(receivedMessages);
      }.bind(this));      
    }.bind(this));
  }
};