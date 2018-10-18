// https://github.com/phoboslab/jsmpeg/blob/master/src/websocket.js
window.JSMpeg.Source.WebSocket = function (onOpen, onMessage) {
	'use strict'

	function PlayerSource (url, options) {
		this.url = url
		this.options = options
		this.socket = null

		this.callbacks = {connect: [], data: []}
		this.destination = null

		this.reconnectInterval = options.reconnectInterval !== undefined
			? options.reconnectInterval
			: 5
		this.shouldAttemptReconnect = !!this.reconnectInterval

		this.completed = false
		this.established = false
		this.progress = 0

		this.reconnectTimeoutId = 0

		return this
	}

	PlayerSource.prototype.connect = function(destination) {
		this.destination = destination
	}

	PlayerSource.prototype.destroy = function() {
		clearTimeout(this.reconnectTimeoutId)
		this.shouldAttemptReconnect = false
		this.socket.close()
	}

	PlayerSource.prototype.start = function() {
		this.shouldAttemptReconnect = !!this.reconnectInterval
		this.progress = 0
		this.established = false

		this.socket = new WebSocket(this.url, this.options.protocols || null)
		this.socket.binaryType = 'arraybuffer'
		this.socket.onmessage = this.onMessage.bind(this)
		this.socket.onopen = this.onOpen.bind(this)
		this.socket.onerror = this.onClose.bind(this)
		this.socket.onclose = this.onClose.bind(this)
	}

	PlayerSource.prototype.resume = function(/*secondsHeadroom*/) {
		// Nothing to do here
	}

	PlayerSource.prototype.onOpen = function() {
		this.progress = 1
		this.established = true
		onOpen(this)
	}

	PlayerSource.prototype.onClose = function() {
		if (this.shouldAttemptReconnect) {
			clearTimeout(this.reconnectTimeoutId)
			this.reconnectTimeoutId = setTimeout(function(){
				this.start()
			}.bind(this), this.reconnectInterval*1000)
		}
	}

	PlayerSource.prototype.onMessage = function(evt) {
		if (typeof evt.data == 'string') {
			onMessage(evt.data)
		} else if (this.destination) {
			this.destination.write(evt.data)
		}
	}

	PlayerSource.prototype.log = function(msg){
		if (console.log)
			console.log(msg)
	}

	PlayerSource.prototype.sendKeepConnectionOpen = function() {
		this.shouldAttemptReconnect = true
		var message = JSON.stringify({action: 'keepConnectionOpen'})
		this.ws.send(message)
	}

	return PlayerSource
}
