/**
 * Bikini-Bottom
 * This JavaScript file is for Home view.
 */
var xing = xing || {};
xing.bikinibottom = xing.bikinibottom || {};



/**
 * Home view
 */
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






/**
 * Creates a new video message
 */
xing.bikinibottom.Home.New = Class.create({
  ids: {
    CONTAINER: "new",
    FORM: "message-form",
    CONTACT_CHOOSER: "recipient",
    SUBMIT_BUTTON: "submit-new",
    RESET_BUTTON: "reset-new",
    FLASH_CONTAINER: "flash-recorder",
    FLASH_LABEL: "flash-recorder-label"
  },
  
  classNames: {
    MINI_MESSAGE: "mini-message",
    ERROR_MESSAGE: "error-message"
  },
  
  KEY_TEMPLATE: "message_#{friendId}_#{ownerId}_#{date}",
  RECIPIENT_TEMPLATE: '<option value="#{id}">#{displayName}</option>',
  FLASH_URL: "http://localhost:8080/bikinibottom_os/liverecord.swf?action=record",
  
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
    gadgets.window.adjustHeight();
    
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
    this._submitButton = $(this.ids.SUBMIT_BUTTON);
    this._resetButton = $(this.ids.RESET_BUTTON);
    
    this._disableForm();
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
    
    this._enableForm();
  },
  
  _renderRecipients: function() {
    var optionHtml, html;
    
    html = [];
    
    // "each" is here not the prototype method
    this._friends.each(function(friend) {
      optionHtml = this.RECIPIENT_TEMPLATE.interpolate({
        displayName: friend.getDisplayName().escapeHTML(),
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
    this._contactChooser.observe("change", function(event) {
      this._form.subject.focus();
    }.bind(this));
    
    this._form.observe("submit", function(event) {
      event.stop();
      if(this.videoAdded) {
        this._submit();
      } else {
        this._addVideo();
      }
    }.bind(this));
    
    this._form.observe("reset", this._resetVideoForm.bind(this));
  },
  
  _addVideo: function() {
    var msg;
    
    // this needs to be generated here, since we're calling the flash with these params
    this._formData = this._form.serialize(true);
    
    if (!this._formData.recipient) {
      msg = new gadgets.MiniMessage(xing.bikinibottom.moduleId);
      msgElem = msg.createTimerMessage(
        "Please select a recipient. [RES]", 5
      );
      $(msgElem).addClassName(this.classNames.MINI_MESSAGE).addClassName(this.classNames.ERROR_MESSAGE);
      gadgets.window.adjustHeight();
      return;
    }
    
    // Get recipient name for confirmation message
    this._recipientName = this._contactChooser.down("[value='" + this._formData.recipient + "']").innerHTML;
    this.currentVideoKey = this._generateKey(this._owner.getId(), this._formData.recipient);
    
    if (gadgets.flash.getMajorVersion() >= 10) {
      gadgets.flash.embedFlash(
        this.FLASH_URL + "&videoId=" + this.currentVideoKey,
        this.ids.FLASH_CONTAINER,
        10, {
          width: 303,
          height: 227,
          swliveconnect: true,
          allowscriptaccess: "always"
        }
      );
    }
    
    // Show elements
    $(this.ids.FLASH_CONTAINER, this.ids.FLASH_LABEL).invoke("show");
    
    // Adjust gadget height
    gadgets.window.adjustHeight();
    
    this.videoAdded = true;
    this._disableForm();
    this._submitButton.setValue("waiting for video... [RES]");
  },
  
  _videoAddedCallback: function() {
    this._submitButton.setValue("Send video [RES]");
    this._submitButton.enable().focus();
  },
  
  _submit: function() {
    var req, value, recipientSpec;
    value = {
      timestamp: (new Date).getTime(),
      sender: this._owner.getId(),
      senderName: this._owner.getDisplayName().escapeHTML(),
      subject: (this._formData.subject || "Untitled [RES]").escapeHTML(),
      recipient: this._formData.recipient,
      recipientName: this._recipientName
    };
    
    this._disableForm();
    
    req = opensocial.newDataRequest();
    recipientSpec = "VIEWER";
    req.add(req.newUpdatePersonAppDataRequest(recipientSpec, this.currentVideoKey, gadgets.json.stringify(value)), "message_saving");
    req.send(this._submitCallback.bind(this));
  },
  
  _submitCallback: function(data) {
    if (data.get("message_saving").hadError()) {
      alert("error saving message... w000t!");
    } else {
      var msg, msgElem;
      
      msg = new gadgets.MiniMessage(xing.bikinibottom.moduleId);
      msgElem = msg.createTimerMessage(
        "You have succesfully sent a video message to: " + this._recipientName + " [RES]", 10
      );
      $(msgElem).addClassName(this.classNames.MINI_MESSAGE);
      
      this._resetVideoForm();
    }
  },
  
  _resetVideoForm: function() {
    this.videoAdded = false;
    
    // remove the flash video
    $(this.ids.FLASH_CONTAINER).update();
    $(this.ids.FLASH_CONTAINER, this.ids.FLASH_LABEL).invoke("hide");
    
    // reset contactChooser
    this._contactChooser.down().selected = true;
    this._form.subject.clear();
    this._submitButton.setValue("Add Video [RES]");
    this._enableForm();
    
    // update size of gadget
    gadgets.window.adjustHeight();
  },
  
  _generateKey: function(ownerId, friendId) {
    return this.KEY_TEMPLATE.interpolate({
      ownerId: ownerId,
      friendId: friendId,
      date: (new Date).getTime()
    });
  },
  
  _enableForm: function() {
    this._form.getElements().invoke("enable");
  },
  
  _disableForm: function() {
    this._form.getElements().without(this._resetButton).invoke("disable");
  }
});






/**
 * Generic MessageList class
 */
xing.bikinibottom.Home.MessageList = Class.create({
  LIST_TEMPLATE: '<ul>#{messages}</ul>',
  NO_MESSAGES_AVAILABLE: '<li class="hint">#{hint}</li>',
  FLASH_URL: "http://localhost:8080/bikinibottom_os/liverecord.swf?action=play",
  MAX_ENTRIES: 4,
  
  initialize: function() {},
  
  _loadTab: function() {
    this._loadMessages();
    this._showMessages();
    
    if (this._tabLoaded) {
      return;
    }
    
    this._tabLoaded = true;
    this._observeBackButton();
  },
  
  _renderMessages: function(messages) {
    var html;
    if (messages.size() < 1) {
      // No messages found
      html = this.NO_MESSAGES_AVAILABLE.interpolate({
        hint: this.HINT
      });
    } else {
      this.messages = messages.slice(0, this.MAX_ENTRIES);
      html = this.messages.map(this._getMessageEntry.bind(this)).join("");
    }
    
    this.list.innerHTML = this.LIST_TEMPLATE.interpolate({
      messages: html
    });
    
    // observer links of messages
    this._observeMessagesLinks();
    
    gadgets.window.adjustHeight();
    
    // TODO lazy load thumbnail urls and profile urls and bin them with the message recipients
  },
  
  _observeMessagesLinks: function() {
    this.list.select("a").invoke("observe", "click", function(event){
      this._showMovieFor(Event.element(event).hash.replace("#", ""));
    }.bind(this));
  },
  
  _observeBackButton: function() {
    this.backButton.observe("click", function(event){
      this._showMessages();
      gadgets.window.adjustHeight();
      event.stop();
    }.bind(this));
  },
  
  _showMessages: function() {
    this.list.show();
    this.messageDetail.hide();
  },
  
  _showMovieFor: function(movieId) {
    var i;
    if (gadgets.flash.getMajorVersion() >= 10) {
      gadgets.flash.embedFlash(
        this.FLASH_URL + "&videoId=" + movieId,
        this.ids.FLASH_CONTAINER,
        10, {
          width: 303,
          height: 227,
          swliveconnect: true,
          allowscriptaccess: "always"
        }
      );
    }
    
    i = this.messages.pluck("id").indexOf(movieId);
    this.headline.innerHTML = this.headline.innerHTML.interpolate(this.messages[i]);
    
    this.list.hide();
    this.messageDetail.show();
    
    gadgets.window.adjustHeight();
  }
});






/**
 * Class that handles received messages
 */
xing.bikinibottom.Home.Inbox = Class.create(xing.bikinibottom.Home.MessageList, {
  ids: {
    CONTAINER: "inbox",
    FLASH_CONTAINER: "inbox-flash-player",
    LIST: "inbox-list",
    BACK: "inbox-flash-payer-back",
    MESSAGE_HEADLINE: "inbox-flash-player-label",
    MESSAGE_DETAIL: "inbox-message-player"
  },
  
  classNames: {
    UNREAD: "unread"
  },
  
  HINT: "You haven't received any messages yet. [RES]",
  INBOX_MESSAGE_TEMPLATE: '<li><a href="##{id}" class="unread">#{subject}</a>From: #{senderName} (#{date})</li>', // [RES]
  DELIMITER: "-|--|-",
  
  initialize: function($super, parent) {
    $super();
    
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
    this.list = $(this.ids.LIST);
    this.messageDetail = $(this.ids.MESSAGE_DETAIL);
    this.headline = $(this.ids.MESSAGE_HEADLINE);
    this.backButton = $(this.ids.BACK);
  },
  
  getTabData: function() {
    return {
      name: "Inbox", // [RES]
      contentContainer: this.container,
      tooltip: "Received messages", // [RES]
      callback: this._loadTab.bind(this)
    };
  },
  
  _loadMessages: function() {
    xing.bikinibottom.SocialData.getReceivedMessages(function(messages) {
      this._renderMessages(messages);
      this._markUnReadMessages();
    }.bind(this), true);
  },
  
  _getMessageEntry: function(messageObj) {
    return this.INBOX_MESSAGE_TEMPLATE.interpolate(messageObj);
  },
  
  _markUnReadMessages: function() {
    xing.bikinibottom.SocialData.getReadMessages(function(readMessages) {
      this._readMessages = readMessages;
      this._readMessages.each(function(messageId) {
        this.list.select("a[href='#" + messageId + "']").invoke("removeClassName", this.classNames.UNREAD);
      }.bind(this));
    }.bind(this));
  },
  
  _showMovieFor: function($super, messageId) {
    $super(messageId);
    
    this._markAsRead(messageId);
  },
  
  _markAsRead: function(messageId) {
    this._readMessages.push(messageId);
    xing.bikinibottom.SocialData.setReadMessages(this._readMessages);
    this.list.down("a[href='#" + messageId + "']").removeClassName(this.classNames.UNREAD);
  }
});






/**
 * Class that handles sent messages
 */
xing.bikinibottom.Home.Outbox = Class.create(xing.bikinibottom.Home.MessageList, {
  ids: {
    CONTAINER: "outbox",
    FLASH_CONTAINER: "outbox-flash-player",
    LIST: "outbox-list",
    BACK: "outbox-flash-payer-back",
    MESSAGE_HEADLINE: "outbox-flash-player-label",
    MESSAGE_DETAIL: "outbox-message-player"
  },
  
  HINT: "You haven't sent any messages yet. [RES]",
  OUTBOX_MESSAGE_TEMPLATE: '<li><a href="##{id}">#{subject}</a>To: #{recipientName} (#{date})</li>', // [RES]
  
  initialize: function($super, parent) {
    $super();
    
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
    this.list = $(this.ids.LIST);
    this.messageDetail = $(this.ids.MESSAGE_DETAIL);
    this.headline = $(this.ids.MESSAGE_HEADLINE);
    this.backButton = $(this.ids.BACK);
  },
  
  getTabData: function() {
    return {
      name: "Outbox", // [RES]
      contentContainer: this.container,
      tooltip: "Sent messages", // [RES]
      callback: this._loadTab.bind(this)
    };
  },
  
  _loadMessages: function() {
    xing.bikinibottom.SocialData.getSentMessages(this._renderMessages.bind(this), true);
  },
  
  _getMessageEntry: function(messageObj) {
    return this.OUTBOX_MESSAGE_TEMPLATE.interpolate(messageObj);
  }
});
