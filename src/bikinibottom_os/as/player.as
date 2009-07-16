﻿var xing = xing || {};xing.bikinibottom = xing.bikinibottom || {};xing.bikinibottom.player = {	_videoOptions: {},	_uiElements: {},		setVideoOptions: function(videoOptions) {		this._videoOptions = videoOptions;	},		setUiElements: function(uiElements) {		this._uiElements = uiElements;	},		initialize: function() {		this._initVisibility();		this._initPlayer();		this._loadVideo();		this._observe();	},		_initVisibility: function() {		this._uiElements.but_pause._visible = false;	},		_initPlayer: function() {		this._loading();	},		_loadVideo: function() {		var that = this;				this._netConnection = new NetConnection();		this._netConnection.connect(this._videoOptions.url);				this._netStream = new NetStream(this._netConnection);		this._netStream.setBufferTime(3);		this._netStream.onStatus = function(info) { that._onStatus(info); };		this._netStream.onMetaData = function(info) { that._startTimer(info); };				this._uiElements.player.attachVideo(this._netStream);				this._netStream.play(this._videoOptions.id);	},		_observe: function() {		var that = this;				this._uiElements.but_play.onRelease = function() { that._play(); };		this._uiElements.but_pause.onRelease = function() { that._pause(); };		this._uiElements.but_rewind.onRelease = function() { that._rewind(); };	},		_loading: function() {		this._uiElements.txt_status.text = "loading...";		this._uiElements.player._alpha = 30;		this._disable();	},		_showPlay: function() {		this._uiElements.but_play._visible = true;		this._uiElements.but_pause._visible = false;	},		_showPause: function() {		this._uiElements.but_play._visible = false;		this._uiElements.but_pause._visible = true;	},		_enable: function() {		this._uiElements.but_play.enabled = true;		this._uiElements.but_pause.enabled = true;		this._uiElements.but_rewind.enabled = true;	},		_disable: function() {		this._uiElements.but_play.enabled = false;		this._uiElements.but_pause.enabled = false;		this._uiElements.but_rewind.enabled = false;	},		_play: function() {		this._uiElements.player._alpha = 100;				if (this._videoFinished) {			this._videoFinished = false;			this._netStream.seek(0);		} else {			this._netStream.pause();		}	},		_pause: function() {		this._netStream.pause();	},		_rewind: function() {		this._uiElements.player._alpha = 100;			this._netStream.seek(0);		this._netStream.pause(false);	},		_continue: function() {		this._enable();		this._uiElements.txt_status.text = "";		this._uiElements.player._alpha = 100;	},		_end: function() {		this._uiElements.txt_status.text = "";		this._uiElements.player._alpha = 30;		this._videoFinished = true;		this._videoFlushed = false;		this._showPlay();				clearInterval(this._interval);	},		_onStatus: function(info) {		var code = info.code;		trace(code);		if (code == "NetStream.Pause.Notify") {			this._showPlay();		}		if (code == "NetStream.Buffer.Flush") {			this._videoFlushed = true;		}		if (code == "NetStream.Buffer.Empty" && !this._videoFlushed) {			this._loading();		}		if (code == "NetStream.Play.Start" || code == "NetStream.Buffer.Full") {			this._continue();			this._showPause();		}		if (code == "NetStream.Play.Stop") {			this._videoStopped = true;		}		if (this._videoStopped && code == "NetStream.Buffer.Empty") {			this._end();		}	},		_startTimer: function(info) {		var that = this;		var maxDuration = info.duration;				if (maxDuration > 0) {			var maxDurationStr = xing.bikinibottom.utils.convertToTimerFormat(maxDuration);			var updateTimer = function() {				var duration = that._netStream.time;				var durationStr = xing.bikinibottom.utils.convertToTimerFormat(duration);				that._uiElements.txt_timer.text = durationStr + " / " + maxDurationStr;			};						this._interval = setInterval(updateTimer, 250);		}	}};