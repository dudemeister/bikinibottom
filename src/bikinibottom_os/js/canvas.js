/**
 * Bikini-Bottom
 * This JavaScript file is for Canvas view.
 */
var xing = xing || {};
xing.bikinibottom = xing.bikinibottom || {};



/**
 * Canvas view
 */
xing.bikinibottom.Canvas = {
  settings: {
    MAX_ENTRIES: 25,
    FLASH_VERSION: 8,
    FLASH_URL: "http://localhost:8080/bikinibottom_os/liverecord_canvas.swf",
    STREAM_RECORD_URL: "rmtp://bikinibottom.phillipoertel.com/bikinibottom",
    STREAM_PLAY_URL: "rmtp://bikinibottom.phillipoertel.com/simplevideostreaming",
    FLASH_WIDTH: 640,
    FLASH_HEIGHT: 360
  },
  
  initialize: function(settings) {
    this._tabObj = settings.tabs;
    this._view = "canvas";
    this._tabs = $w("Inbox Outbox New");
    
    this._initSubModules();
    this._renderTabs();
  },
  
  _renderTabs: function() {
    var i, tabData, selectedTab;
    for (i in this._submodules) {
      tabData = this._submodules[i].getTabData();
      this._tabObj.addTab(tabData.name, tabData);
    }
    
    selectedTab = gadgets.views.getParams().tab;
    if (selectedTab) {
      this._tabObj.setSelectedTab(this._tabs.indexOf(selectedTab));
    }
  },
  
  _initSubModules: function() {
    this._submodules = {};
    this._tabs.each(function(moduleName) {
      this._submodules[moduleName] = new xing.bikinibottom[moduleName](this, this.settings);
    }.bind(this));
  }
};