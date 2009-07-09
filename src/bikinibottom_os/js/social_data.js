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
    console.log(callback);
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
  }
};