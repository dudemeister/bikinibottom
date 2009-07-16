﻿import flash.external.ExternalInterface;var xing = xing || {};xing.bikinibottom = xing.bikinibottom || {};xing.bikinibottom.recorder = {	_cameraOptions: {},	_uiElements: {},		setCameraOptions: function(cameraOptions) {		this._cameraOptions = cameraOptions;	},		setUiElements: function(uiElements) {		this._uiElements = uiElements;	},		initialize: function(callback) {		this._callback = callback;				this._initVisibility();		this._initCamera();		this._initMicrophone();		this._attachVideo();		this._observe();	},		_initCamera: function() {		trace("initCamera");				this._cam = this._getCamera();		if (!this._cam) {			return this._noCameraFound();		}				trace("found camera");				this._cam.setMode(			this._cameraOptions.width,			this._cameraOptions.height,			this._cameraOptions.fps		);		this._cam.setQuality(			this._cameraOptions.bandwidth,			this._cameraOptions.compression		);	},		_getCamera: function() {		trace("_getCamera");				var cameraNames = Camera.names;		if (!cameraNames.length) {			return null;		}				// Mac detection		for (var i=0; i<cameraNames.length; i++) {			if (cameraNames[i] == "USB Video Class Video") {				return Camera.get(i);			}		}				return Camera.get();	},		_attachVideo: function() {		this._uiElements.recorder.attachVideo(this._cam);	},		_noCameraFound: function() {		// TODO!	},		_initMicrophone: function() {		this._micro = Microphone.get();		this._micro.setSilenceLevel(5, 300);	},		_initVisibility: function() {		this._uiElements.but_stop._visible = false;	},		_initVideo: function() {		this._uiElements.recorder.attachVideo(this._cam);	},		_observe: function() {		var that = this;		this._uiElements.but_record.onRelease = function() { that._startRecording(); };		this._uiElements.but_stop.onRelease = function() { that._stopRecording(); };	},		_startRecording: function() {		var that = this;				this._uiElements.but_record._visible = false;		this._uiElements.txt_status.text = "Connecting...";		this._uiElements.recorder._alpha = 30;				trace("connecting to " + this._cameraOptions.url);				this._netConnection = new NetConnection();		this._netConnection.connect(this._cameraOptions.url);		this._netConnection.onStatus = function() {			if (!that._netConnection.isConnected) {				return;			}						that._netStream = new NetStream(that._netConnection);			that._netStream.attachAudio(that._micro);			that._netStream.attachVideo(that._cam);			that._netStream.publish(that._cameraOptions.id, "record");						// UI Feedback			that._uiElements.txt_status.text = "";			that._uiElements.recorder._alpha = 100;			that._uiElements.but_stop._visible = true;					var updateTimer = function() {				var duration = that._netStream.time;				that._uiElements.txt_timer.text = xing.bikinibottom.utils.convertToTwoDigitFormat(duration);								if (duration >= that._cameraOptions.max_duration) {					stopRecording();				}			}			that._interval = setInterval(updateTimer, 75);					}	},		_stopRecording: function() {		this._uiElements.but_stop._visible = false;			clearInterval(this._interval);				this._netStream.close();				// Stop webcam by setting the fps (yes this is hack - so, fuck you)		this._cam.setMode(this._options.width, this._options.height, 0.0000001);				// UI Feedback		this._uiElements.recorder._alpha = 30;		this._uiElements.txt_status.text = "Recorded";				// Call javascript		ExternalInterface.call(this._callback);	}};