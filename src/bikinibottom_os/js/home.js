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
  settings: {
    MAX_ENTRIES: 4,
    FLASH_VERSION: 8,
    FLASH_URL: "http://localhost:8080/bikinibottom_os/video_home.swf",
    STREAM_RECORD_URL: "rtmp://bikinibottom.phillipoertel.com/bikinibottom",
    STREAM_PLAY_URL: "rtmp://bikinibottom.phillipoertel.com/simplevideostreaming",
    FLASH_WIDTH: 303,
    FLASH_HEIGHT: 170
  },
  
  initialize: function(settings) {
    this._tabObj = settings.tabs;
    this._view = "home";
    this._tabs = $w("New Inbox Outbox");
    
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
    this._tabs.each(function(moduleName) {
      this._submodules[moduleName] = new xing.bikinibottom[moduleName](this, this.settings);
    }.bind(this));
  },
  
  goToTab: function(tabName, params)  {
  	var tabIndex = this._tabs.indexOf(tabName);
  	if(params) {
  		this._submodules[tabName].setViewParams(params);
  	}
  	this._tabObj.setSelectedTab(tabIndex);
  }
};