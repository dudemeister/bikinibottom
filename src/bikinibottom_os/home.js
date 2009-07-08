/**
 * Bikini-Bottom
 * This JavaScript file is for Home view.
 */
var xing = xing || {};
xing.bikinibottom = {};

xing.bikinibottom.Home = {
  tabs: {
    "New": {
      id: "new",
      callback: function() {},
      tooltip: "Create new video message"
    },
    
    "Inbox": {
      id: "inbox",
      callback: function() {},
      tooltip: "Received messages"
    },
    
    "Outbox": {
      id: "outbox",
      callback: function() {},
      tooltip: "Sent messages"
    }
  },
  
  initialize: function(settings) {
    this._tabObj = settings.tabs;
    this._createTabs();
  },
  
  _createTabs: function() {
    for (var tabName in this.tabs) {
      this._tabObj.addTab(tabName, {
        contentContainer: _gel(this.tabs[tabName].id),
        callback: this.tabs[tabName].callback,
        tooltip: this.tabs[tabName].tooltip
      });
    }
  }
};
