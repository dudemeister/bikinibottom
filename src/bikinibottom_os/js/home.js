/**
 * Bikini-Bottom
 * This JavaScript file is for Home view.
 */
var xing = xing || {};
xing.bikinibottom = {};

xing.bikinibottom.Home = {
  initialize: function(settings) {
    this._tabObj = settings.tabs;
    
    this._initSubModules();
    this._renderTabs();
  },
  
  _renderTabs: function() {
    var i, tabData;
    for (i in this._submodules) {
      tabData = this._submodules[i].getTabData();
      this._tabObj.addTab(tabData.name, tabData);
    }
  },
  
  _initSubModules: function() {
    this._submodules = {};
    $w("TextChat New Inbox Outbox").each(function(moduleName) {
      this._submodules[moduleName] = new this[moduleName](this);
    }.bind(this));
  }
};




xing.bikinibottom.Home.New = Class.create({
  ids: {
    CONTAINER: "new",
    FORM: "message-form",
    CONTACT_CHOOSER: "recipient"
  },
  
  initialize: function() {
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
  },
  
  getTabData: function() {
    return {
      name: "New", // [RES]
      contentContainer: this.container,
      tooltip: "Create new video message", // [RES]
      callback: this._loadTab.bind(this)
    };
  },
  
  _loadTab: function() {
    if (this._tabLoaded) {
      return;
    }
    
    this._initElements();
    this._loadData();
    this._observe();
    
    this._tabLoaded = true;
  },
  
  _initElements: function() {
    this._form = $(this.ids.FORM);
    this._contactChooser = $(this.ids.CONTACT_CHOOSER);
  },
  
  _loadData: function() {
    var req, friendsSpec, friendsParams, viewerSpec, viewerParams;
    
    req = opensocial.newDataRequest();
    
    viewerSpec = opensocial.IdSpec.PersonId.VIEWER;
    viewerParams = {};
    req.add(req.newFetchPersonRequest(viewerSpec, viewerParams), "viewer");
    
    friendsSpec = opensocial.newIdSpec({ userId: "VIEWER", groupId: "FRIENDS" });
    friendsParams = {};
    friendsParams[opensocial.DataRequest.PeopleRequestFields.MAX] = 100;
    req.add(req.newFetchPeopleRequest(friendsSpec, friendsParams), "friends");
    
    req.send(this._dataCallback.bind(this));
  },
  
  _dataCallback: function(data) {
    this._viewer = data.get("viewer").getData();
    this._friends = data.get("friends").getData();
    
    this._renderRecipients();
  },
  
  _renderRecipients: function() {
    var optionTemplate, optionHtml, html;
    optionTemplate = '<option value="#{id}">#{displayName}</option>';
    html = [];
    
    // "each" is here not the prototype method
    this._friends.each(function(friend) {
      optionHtml = optionTemplate.interpolate({
        displayName: friend.getDisplayName(),
        id: friend.getId()
      });
      html.push(optionHtml);
    });
    
    this._contactChooser.insert(html.join(""));
    this._contactChooser.enable();
    this._contactChooser.value = "_default_";
  },
  
  _observe: function() {
    this._form.observe("submit", function(event) {
      event.stop();
      this._submit();
    }.bind(this));
  },
  
  _submit: function() {
    this._form.getElements().invoke("disable");
    alert("submitting");
  }
});




xing.bikinibottom.Home.Inbox = Class.create({
  ids: {
    CONTAINER: "inbox"
  },
  
  initialize: function(parent) {
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
  },
  
  getTabData: function() {
    return {
      name: "Inbox", // [RES]
      contentContainer: this.container,
      tooltip: "Received messages", // [RES]
      callback: this._loadTab.bind(this)
    };
  },
  
  _loadTab: function() {
    
  }
});




xing.bikinibottom.Home.Outbox = Class.create({
  ids: {
    CONTAINER: "outbox"
  },
  
  initialize: function() {
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
  },
  
  getTabData: function() {
    return {
      name: "Outbox", // [RES]
      contentContainer: this.container,
      tooltip: "Sent messages",  // [RES]
      callback: this._loadTab.bind(this)
    };
  },
  
  _loadTab: function() {
    
  }
});


xing.bikinibottom.Home.TextChat = Class.create({
  ids: {
    CONTAINER: "text-chat"
  },
  
  initialize: function(parent) {
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
  },
  
  getTabData: function() {
    return {
      name: "Text-Chat", // [RES]
      contentContainer: this.container,
      tooltip: "Chat", // [RES]
      callback: this._loadTab.bind(this)
    };
  },
  
  _loadTab: function() {
    
  }
});