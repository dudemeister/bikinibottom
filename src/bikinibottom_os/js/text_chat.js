xing.bikinibottom.Home.TextChat = Class.create({
  ids: {
    CONTAINER: "text-chat",
    FORM: "text-chat-form",
    CONTACT_CHOOSER: "text-chat-partner",
    MESSAGE_INPUT: "text-chat-message"
  },
  
  RECIPIENT_TEMPLATE: '<option value="#{id}">#{displayName}</option>',
  
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
        this._messageInput.value = 'Type your message here ...'; // [RES]
      }
    }.bind(this));    
  },
  
  _loadData: function() {
    xing.bikinibottom.SocialData.getOwner(function(owner) {
      this._owner = owner;
      
      xing.bikinibottom.SocialData.getOwnerFriends(this._dataCallback.bind(this));
    }.bind(this));
  },
  
  _dataCallback: function(friends) {
    this._friends = friends;
    
    this._renderRecipients();
    
    this._form.getElements().invoke("enable");
  },
  
  _renderRecipients: function() {
    var optionHtml, html;
    
    html = [];
    
    // "each" is here not the prototype method
    this._friends.each(function(friend) {
      optionHtml = this.RECIPIENT_TEMPLATE.interpolate({
        displayName: friend.getDisplayName(),
        id: friend.getId()
      });
      html.push(optionHtml);
    }.bind(this));
    
    this._contactChooser.insert(html.join(""));
    this._contactChooser.enable();
    // Select first entry
    this._contactChooser.down().selected = true;
  },
  
  _observe: function() {
    this._form.observe("submit", function(event) {
      event.stop();
      data = {
        sender: this._owner.getId(),
        recipient: this._contactChooser.value, 
        message: this._messageInput.value
      };
      console.log('Sending data: ' + $H(data).toJSON());
      Dispatcher.sendMessage($H(data).toJSON() + "\000");
    }.bind(this));
  }
  
});