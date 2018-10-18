const port = document.location.port? ':' + document.location.port : ''
const canvas = document.getElementById('video-canvas')
const url = 'ws://' + document.location.hostname + port + '/'

const player = new window.JSMpeg.Player(url, {
	source: window.JSMpeg.Source.WebSocket(function () {
		console.log('Connected to ws')
		player.source.socket.send('client-ready')
	}, function (action) {
		console.log('Received server action', action)
	}),
	canvas,
	streaming: true,
	autoplay: true
})
