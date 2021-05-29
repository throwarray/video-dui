const canvas = document.getElementById('video-canvas')
const port = document.location.port? ':' + document.location.port : ''
const url = 'ws://' + document.location.hostname + port + '/'

function resize () {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

window.onresize = resize;

const player = new window.JSMpeg.Player(url, {
	source: window.JSMpeg.Source.WebSocket(function () {
		player.source.socket.send('video-stream:join')
	}, function (action) {
		try {
			action = JSON.parse(action)
		} catch (e) {
			return
		}

		// Reload the page when the video is finished?
		if (action && typeof action == 'object') {
			if (action.type == 'video-stream:close') {
				setTimeout(function () {
					window.location.reload()
				}, 500)
			}
		}
	}),
	canvas,
	streaming: true,
	autoplay: true
})

resize();
console.log('[video-stream] dui ready')
