// https://github.com/phoboslab/jsmpeg/blob/b5799bfc213c7732e1f68754d9244f47258d8be5/src/websocket.js
// changes: line 4, 59, 79-81, 88
JSMpeg.Source.WebSocket = function(onOpen, onMessage){ "use strict";

var WSSource = function(url, options) {
	this.url = url;
	this.options = options;
	this.socket = null;
	this.streaming = true;

	this.callbacks = {connect: [], data: []};
	this.destination = null;

	this.reconnectInterval = options.reconnectInterval !== undefined
		? options.reconnectInterval
		: 5;
	this.shouldAttemptReconnect = !!this.reconnectInterval;

	this.completed = false;
	this.established = false;
	this.progress = 0;

	this.reconnectTimeoutId = 0;

	this.onEstablishedCallback = options.onSourceEstablished;
	this.onCompletedCallback = options.onSourceCompleted; // Never used
};

WSSource.prototype.connect = function(destination) {
	this.destination = destination;
};

WSSource.prototype.destroy = function() {
	clearTimeout(this.reconnectTimeoutId);
	this.shouldAttemptReconnect = false;
	this.socket.close();
};

WSSource.prototype.start = function() {
	this.shouldAttemptReconnect = !!this.reconnectInterval;
	this.progress = 0;
	this.established = false;
	
	this.socket = new WebSocket(this.url, this.options.protocols || null);
	this.socket.binaryType = 'arraybuffer';
	this.socket.onmessage = this.onMessage.bind(this);
	this.socket.onopen = this.onOpen.bind(this);
	this.socket.onerror = this.onClose.bind(this);
	this.socket.onclose = this.onClose.bind(this);
};

WSSource.prototype.resume = function(secondsHeadroom) {
	// Nothing to do here
};

WSSource.prototype.onOpen = function() {
	this.progress = 1;
	onOpen(this)
};

WSSource.prototype.onClose = function() {
	if (this.shouldAttemptReconnect) {
		clearTimeout(this.reconnectTimeoutId);
		this.reconnectTimeoutId = setTimeout(function(){
			this.start();	
		}.bind(this), this.reconnectInterval*1000);
	}
};

WSSource.prototype.onMessage = function(ev) {
	var isFirstChunk = !this.established;
	this.established = true;

	if (isFirstChunk && this.onEstablishedCallback) {
		this.onEstablishedCallback(this);
	}

	if (typeof ev.data == 'string') {
		onMessage(ev.data)
	} else if (this.destination) {
		this.destination.write(ev.data)
	}
};

return WSSource;

}
