/**
 * Bikini-Bottom
 * This JavaScript file is for Home view.
 */
var xing = xing || {};
xing.bikinibottom = xing.bikinibottom || {};

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
    CONTACT_CHOOSER: "recipient",
    SUBMIT_BUTTON: "submit-new",
    FLASH_CONTAINER: "flash-recorder",
    FLASH_LABEL: "flash-recorder-label"
  },
  
  classNames: {
    MINI_MESSAGE: "mini-message"
  },
  
  KEY_TEMPLATE: "message_#{friendId}_#{ownerId}_#{date}",
  RECIPIENT_TEMPLATE: '<option value="#{id}">#{displayName}</option>',
  FLASH_URL: "http://localhost:8080/bikinibottom_os/liverecord.swf?action=record",
  
  initialize: function() {
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
    this.submitButton = $(this.ids.SUBMIT_BUTTON);
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
    
    this._form.getElements().invoke("disable");
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
  },
  
  _addVideo: function() {
    // this needs to be generated here, since we're calling the flash with these params
    this._formData = this._form.serialize(true);
    // Get recipient name for confirmation message
    this._recipientName = this._contactChooser.down("[value='" + this._formData.recipient + "']").innerHTML;
    this.currentVideoKey = this._generateKey(this._owner.getId(), this._formData.recipient);
    
    if (gadgets.flash.getMajorVersion() >= 10) {
      gadgets.flash.embedFlash(
        this.FLASH_URL + "&videoId=" + this.currentVideoKey,
        this.ids.FLASH_CONTAINER,
        10,
        { width: 303, height: 227 }
      );
    }
    
    // Show elements
    $(this.ids.FLASH_CONTAINER, this.ids.FLASH_LABEL).invoke("show");
    
    // Adjust gadget height
    gadgets.window.adjustHeight();
    
    this.videoAdded = true;
    this._form.getElements().invoke("disable");
    this.submitButton.setValue("waiting for video... [RES]");
  },
  
  _videoAddedCallback: function() {
    this.submitButton.setValue("Send video [RES]");
    this.submitButton.enable();
  },
  
  _submit: function() {
    var req, value, recipientSpec;
    value = {
      timestamp: (new Date).getTime(),
      sender: this._owner.getId(),
      subject: (this._formData.subject || "Untitled [RES]").escapeHTML(),
      recipient: this._recipientName
    };
    
    this._form.getElements().invoke("disable");
    
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
    this.submitButton.setValue("Add Video [RES]");
    this._form.getElements().invoke("enable");

    // update size of gadget
    gadgets.window.adjustHeight();
  },
  
  _generateKey: function(ownerId, friendId) {
    return this.KEY_TEMPLATE.interpolate({
      ownerId: ownerId,
      friendId: friendId,
      date: (new Date).getTime()
    });
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
  
  OUTBOX_TEMPLATE: '<ul>#{messages}</ul>',
  MESSAGE_TEMPLATE: '<li><a href="##{id}">#{subject}</a>To: #{recipient} (#{date})</li>',
  
  initialize: function() {
    this.parent = parent;
    this.container = $(this.ids.CONTAINER);
  },
  
  getTabData: function() {
    return {
      name: "Outbox", // [RES]
      contentContainer: this.container,
      tooltip: "Sent messages", // [RES]
      callback: this._loadTab.bind(this)
    };
  },
  
  _loadTab: function() {
    this._loadMessages();
    
    this._tabLoaded = true;
  },
  
  _loadMessages: function() {
    var req, viewerSpec;
    
    req = opensocial.newDataRequest();
    viewerSpec = opensocial.newIdSpec({ userId: "OWNER", groupId: "SELF" });
    req.add(req.newFetchPersonAppDataRequest(viewerSpec, "*"), "messages");
    req.send(this._renderMessages.bind(this));
  },
  
  _renderMessages: function(data) {
    if (data.hadError()) {
      alert("error retrieving messages... w000t!");
      return;
    }
    
    var messages, outbox, messageObj, i, json, html;
    
    messages = data.get("messages").getData();
    html = [];
    
    xing.bikinibottom.SocialData.getOwner(function(owner) {
      outbox = messages[owner.getId()];
      for (id in outbox) {
        json = gadgets.util.unescapeString(outbox[id]);
        json = gadgets.json.parse(json);
        messageObj = Object.extend(json, {
          id: id,
          date: new Date(json.timestamp).toGMTString()
        });
        html.push(this._getMessageEntry(messageObj));
      }
      
      // Put it in the dom tree
      this.container.innerHTML = this.OUTBOX_TEMPLATE.interpolate({
        messages: html.join("")
      });
      
      gadgets.window.adjustHeight();
    }.bind(this));
  },
  
  _getMessageEntry: function(messageObj) {
    return this.MESSAGE_TEMPLATE.interpolate(messageObj);
  }
});
