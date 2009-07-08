xing.bikinibottom.Home.TextChat = Class.create({
  ids: {
    CONTAINER: "text-chat",
    FORM: "text-chat-form",
    CONTACT_CHOOSER: "text-chat-partner",
    MESSAGE_INPUT: "text-chat-message"
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
    this._messageInput = $(this.ids.MESSAGE_INPUT);
    //this._setDefaultMessageRemover();
    this._form.getElements().invoke("disable");
  },
  
  _setDefaultMessageRemover: function() {
    this._messageInput.observe('focus', function() {
      if (this._messageInput.value == this._messageInput.defaultValue) {
        this._messageInput.value = '';
      }
    }.bind(this));
    this._messageInput.observe('blur', function() {
      if (this._messageInput.value == '') {
        this._messageInput.value = 'Type your message here ...';
      }
    }.bind(this));    
  },
  
  _loadData: function() {
    console.log('_loadData');
    var req, friendsSpec, friendsParams, ownerSpec, ownerParams;
    
    req = opensocial.newDataRequest();
    
    ownerSpec = opensocial.IdSpec.PersonId.OWNER;
    ownerParams = {};
    req.add(req.newFetchPersonRequest(ownerSpec, ownerParams), "owner");
    
    friendsSpec = opensocial.newIdSpec({ userId: "VIEWER", groupId: "FRIENDS" });
    friendsParams = {};
    friendsParams[opensocial.DataRequest.PeopleRequestFields.MAX] = 100;
    req.add(req.newFetchPeopleRequest(friendsSpec, friendsParams), "friends");
    
    req.send(this._dataCallback.bind(this));
  },
  
  _dataCallback: function(data) {
    console.log('_dataCallback');
    this._owner = data.get("owner").getData();
    this._friends = data.get("friends").getData();
    
    this._renderRecipients();
    
    this._form.getElements().invoke("enable");
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
    // Select first entry
    this._contactChooser.down().selected = true;
  },
  
  _observe: function() {
    this._form.observe("submit", function(event) {
      event.stop();
      data = {
        'sender': this._owner.getId(),
        'recipient': this._contactChooser.value, 
        'message': this._messageInput.value
      };
      console.log('Sending data: ' + $H(data).toJSON());
      Dispatcher.sendMessage($H(data).toJSON());
    }.bind(this));
  }
  
});