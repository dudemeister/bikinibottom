/**
 * Fixes the buggy behaviour of the persistence storage in OSDE
 * http://code.google.com/p/opensocial-development-environment/issues/detail?id=34&can=4
 */
(function() {
  var KEY_SPLIT = "-|--|-";
  
  opensocial.DataRequest.prototype.newFetchPersonAppDataRequest_org =
    opensocial.DataRequest.prototype.newFetchPersonAppDataRequest;
  
  opensocial.DataRequest.prototype.newFetchPersonAppDataRequest = function(idSpec, keys) {
    if (keys == "*") {
      var storage, allKeys;
      storage = window.globalStorage[location.hostname].osdeKeys || {};
      allKeys = storage.value || "";
      keys = allKeys.split(KEY_SPLIT);
    }
    
    return this.newFetchPersonAppDataRequest_org(idSpec, keys);
  };
  
  opensocial.DataRequest.prototype.newRemovePersonAppDataRequest_org =
    opensocial.DataRequest.prototype.newRemovePersonAppDataRequest;
  
  opensocial.DataRequest.prototype.newRemovePersonAppDataRequest = function(idSpec, key) {
    var storage, allKeys;
    storage = window.globalStorage[location.hostname].osdeKeys || {};
    allKeys = storage.value || "";
    allKeys = allKeys.split(KEY_SPLIT);
    allKeys = allKeys.without(key);
    
    window.globalStorage[location.hostname].osdeKeys = allKeys.join(KEY_SPLIT);
    
    return this.newRemovePersonAppDataRequest_org(idSpec, key);
  };
  
  opensocial.DataRequest.prototype.newUpdatePersonAppDataRequest_org = 
    opensocial.DataRequest.prototype.newUpdatePersonAppDataRequest;
  
  opensocial.DataRequest.prototype.newUpdatePersonAppDataRequest = function(idSpec, key, value) {
    var storage, allKeys;
    storage = window.globalStorage[location.hostname].osdeKeys || {};
    allKeys = storage.value || "";
    allKeys = allKeys.split(KEY_SPLIT);
    allKeys.push(key);
    allKeys = allKeys.uniq();
    
    window.globalStorage[location.hostname].osdeKeys = allKeys.join(KEY_SPLIT);
    
    return this.newUpdatePersonAppDataRequest_org(idSpec, key, value);
  };
})();