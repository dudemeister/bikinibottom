/**
 * Creates a new video message
 */
xing.bikinibottom.New = Class.create({
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
  
  KEY_TEMPLATE: "message_#{randomKey}_#{date}",
  RECIPIENT_TEMPLATE: '<option value="#{id}">#{displayName}</option>',
  PM_SUBJECT: "You received a new video message \"#{subject}\" from #{senderName}!",
  PM_BODY: "Click here to watch it: #{url}",
  ON_PROGRESS: "Loaded #{loaded} of #{total} contacts...",
  
  initialize: function(parent, settings) {
    this.parent = parent;
    this.settings = settings;
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
      (function() { gadgets.window.adjustHeight(); }).delay(0.1);
      return;
    }
    
    this._initElements();
    this._loadData();
    this._observe();

    (function() { gadgets.window.adjustHeight(); }).delay(0.1);
    this._tabLoaded = true;
  },
  
  _initElements: function() {
    this._form = $(this.ids.FORM);
    this._contactChooser = $(this.ids.CONTACT_CHOOSER);
    this._contactChooserFirst = this._contactChooser.down();
    this._submitButton = $(this.ids.SUBMIT_BUTTON);
    this._resetButton = $(this.ids.RESET_BUTTON);
    
    this._disableForm();
  },
  
  _loadData: function() {
    xing.bikinibottom.SocialData.getOwner(function(owner) {
      this._owner = owner;
      
      xing.bikinibottom.SocialData.getOwnerFriends(
        this._dataCallback.bind(this), this._onProgress.bind(this)
      );
    }.bind(this));
  },
  
  _onProgress: function(loaded, total) {
    this._contactChooserFirst.update(this.ON_PROGRESS.interpolate({
      loaded: loaded,
      total: total
    }));
  },
  
  _dataCallback: function(friends) {
    this._friends = friends;
    
    this._renderRecipients();
    
    this._enableForm();
  },
  
  _renderRecipients: function() {
    var optionHtml, html, potentialRecipients;
    
    html = [];
    
    // Add a test recipient
    potentialRecipients = [{
      getDisplayName: function() { return "TEST RECIPIENT (for outbox)"; },
      getId: function() { return "test.test"; }
    }].concat(this._friends);
    
    // "each" is here not the prototype method
    potentialRecipients.each(function(friend) {
      optionHtml = this.RECIPIENT_TEMPLATE.interpolate({
        displayName: friend.getDisplayName().escapeHTML(),
        id: friend.getId()
      });
      html.push(optionHtml);
    }.bind(this));
    
    this._contactChooser.insert(html.join(""));
    this._contactChooser.enable();
    // Select first entry
    this._contactChooserFirst.selected = true;
    this._contactChooserFirst.update("-- Please select [RES] --");
  },
  
  _observe: function() {
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
    var msg, url;
    
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
    this.currentVideoKey = this._generateKey();
    
    if (gadgets.flash.getMajorVersion() >= this.settings.FLASH_VERSION) {
      url = this.settings.FLASH_URL + "?" + this._getVideoParams(this.currentVideoKey);
      
      gadgets.flash.embedFlash(
        url,
        this.ids.FLASH_CONTAINER,
        this.settings.FLASH_VERSION, {
          width: this.settings.FLASH_WIDTH,
          height: this.settings.FLASH_HEIGHT,
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
  
  _getVideoParams: function(id) {
    var methodName = "__flashCallback";
    window[methodName] = this._videoAddedCallback.bind(this);
    
    return Object.toQueryString({
      action: "record",
      videoId: id,
      recordUrl: this.settings.STREAM_RECORD_URL,
      playUrl: this.settings.STREAM_PLAY_URL,
      callback: methodName
    });
  },
  
  _videoAddedCallback: function() {
    this._submitButton.setValue("Send video [RES]");
    this._submitButton.enable().focus();
  },
  
  _submit: function() {
    var req, value, recipientSpec;
    
    this._formData.subject = this._formData.subject || "Untitled [RES]";
    value = {
      timestamp: (new Date).getTime(),
      sender: this._owner.getId(),
      senderName: this._owner.getDisplayName().escapeHTML(),
      subject: this._formData.subject.escapeHTML(),
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
      console.log("error saving message... w000t!");
    } else {
      var msg, msgElem;
      
      this._sendPrivateMessage();
      
      // Show info
      msg = new gadgets.MiniMessage(xing.bikinibottom.moduleId);
      msgElem = msg.createTimerMessage(
        "You have succesfully sent a video message to: " + this._recipientName + " [RES]", 10
      );
      $(msgElem).addClassName(this.classNames.MINI_MESSAGE);
      
      this._resetVideoForm();
    }
  },
  
  _sendPrivateMessage: function() {
    var body, subject, url, urlTemplate;
    
    urlTemplate = new gadgets.views.View("canvas").getUrlTemplate() || "";
    url = urlTemplate
      .replace("{name}", gadgets.util.getUrlParameters().app)
      .replace("&{-join|&|params}", "");
    
    body = this.PM_BODY.interpolate({
      url: url
    });
    
    subject = this.PM_SUBJECT.interpolate({
      senderName: this._owner.getDisplayName(),
      subject: this._formData.subject
    });
    
    xing.bikinibottom.SocialData.sendPrivateMessage(this._formData.recipient, subject, body);
  },
  
  _resetVideoForm: function() {
    this.videoAdded = false;
    
    // remove the flash video
    $(this.ids.FLASH_CONTAINER).update();
    $(this.ids.FLASH_CONTAINER, this.ids.FLASH_LABEL).invoke("hide");
    
    // reset contactChooser
    this._contactChooserFirst.selected = true;
    
    this._form.subject.clear();
    this._submitButton.setValue("Add Video [RES]");
    this._enableForm();
    
    // update size of gadget
    gadgets.window.adjustHeight();
  },
  
  _generateKey: function() {
    return this.KEY_TEMPLATE.interpolate({
      randomKey: (Math.random() * 10000000),
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
xing.bikinibottom.MessageList = Class.create({
  LIST_TEMPLATE: '<ul>#{messages}</ul>',
  NO_MESSAGES_AVAILABLE: '<li class="hint">#{hint}</li>',
  
  initialize: function(settings) {
    this.settings = settings;
  },
  
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
      this.messages = messages.slice(0, this.settings.MAX_ENTRIES);
      html = this.messages.map(this._getMessageEntry.bind(this)).join("");
    }
    
    this.list.innerHTML = this.LIST_TEMPLATE.interpolate({
      messages: html
    });
    
    // observe links of messages
    this._observeMessagesLinks();
    
    gadgets.window.adjustHeight();
  },
  
  _loadUserData: function(messages, userType) {
    var userIds, messageThumbnails, userData, messageThumbnail;
    
    userIds = messages.pluck(userType);
    messageThumbnails = this.list.select("img.thumbnail");
    
    xing.bikinibottom.SocialData.getUserDetails(userIds.uniq().compact().without("test.test"), function(data) {
      userIds.each(function(userId, index) {
        userData = data[userId];
        if (userData) {
          var profileUrl = userData.profileUrl;
          
          messageThumbnail = messageThumbnails[index];
          if (messageThumbnail) {
            messageThumbnail.src = userData.thumbnailUrl;
            messageThumbnail.observe("click", function() {
              parent.location = profileUrl;
            });
          }
        }
      });
    });
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
    var i, url;
    
    if (gadgets.flash.getMajorVersion() >= this.settings.FLASH_VERSION) {
      url = this.settings.FLASH_URL + "?" + this._getVideoParams(movieId);
      
      gadgets.flash.embedFlash(
        url,
        this.ids.FLASH_CONTAINER,
        this.settings.FLASH_VERSION, {
          width: this.settings.FLASH_WIDTH,
          height: this.settings.FLASH_HEIGHT,
          swliveconnect: true,
          allowscriptaccess: "always"
        }
      );
    }
    
    i = this.messages.pluck("id").indexOf(movieId);
    this.headline.innerHTML = this._headlineTemplate.interpolate(this.messages[i]);
    
    this.list.hide();
    this.messageDetail.show();
    
    gadgets.window.adjustHeight();
  },
  
  _getVideoParams: function(id) {
    return Object.toQueryString({
      action: "play",
      videoId: id,
      playUrl: this.settings.STREAM_PLAY_URL
    });
  }
});






/**
 * Class that handles received messages
 */
xing.bikinibottom.Inbox = Class.create(xing.bikinibottom.MessageList, {
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
  INBOX_MESSAGE_TEMPLATE: '<li><img src="https://www.xing.com/img/users/nobody_m_s2.gif" width="30" height="40" class="thumbnail" /><a href="##{id}" class="unread">#{subject}</a>From: #{senderName} (#{date})</li>', // [RES]
  DELIMITER: "-|--|-",
  
  initialize: function($super, parent, settings) {
    $super(settings);
    
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
    this.list = $(this.ids.LIST);
    this.messageDetail = $(this.ids.MESSAGE_DETAIL);
    this.headline = $(this.ids.MESSAGE_HEADLINE);
    this.backButton = $(this.ids.BACK);
    
    this._headlineTemplate = this.headline.innerHTML;
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
      this._loadUserData(messages, "sender");
    }.bind(this), true);
  },
  
  _getMessageEntry: function(messageObj) {
    if (!messageObj) {
      return;
    }
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
xing.bikinibottom.Outbox = Class.create(xing.bikinibottom.MessageList, {
  ids: {
    CONTAINER: "outbox",
    FLASH_CONTAINER: "outbox-flash-player",
    LIST: "outbox-list",
    BACK: "outbox-flash-payer-back",
    MESSAGE_HEADLINE: "outbox-flash-player-label",
    MESSAGE_DETAIL: "outbox-message-player"
  },
  
  HINT: "You haven't sent any messages yet. [RES]",
  OUTBOX_MESSAGE_TEMPLATE: '<li><img src="https://www.xing.com/img/users/nobody_m_s2.gif" width="30" height="40" class="thumbnail" /><a href="##{id}">#{subject}</a>To: #{recipientName} (#{date})</li>', // [RES]
  
  initialize: function($super, parent, settings) {
    $super(settings);
    
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
    this.list = $(this.ids.LIST);
    this.messageDetail = $(this.ids.MESSAGE_DETAIL);
    this.headline = $(this.ids.MESSAGE_HEADLINE);
    this.backButton = $(this.ids.BACK);
    
    this._headlineTemplate = this.headline.innerHTML;
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
    xing.bikinibottom.SocialData.getSentMessages(function(messages) {
      this._renderMessages(messages);
      this._loadUserData(messages, "recipient");
    }.bind(this), true);
  },
  
  _getMessageEntry: function(messageObj) {
    if (!messageObj) {
      return;
    }
    return this.OUTBOX_MESSAGE_TEMPLATE.interpolate(messageObj);
  }
});