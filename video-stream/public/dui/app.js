const canvas = document.getElementById('video-canvas')
const query = parseQuery(window.location.search)

function parseQuery(queryString = '') {
	let query = {}
	let pairs = (queryString[0] === '?' ?
		queryString.substr(1) : queryString).split('&')

	for (let i = 0; i < pairs.length; i++) {
		if (pairs[i]) {
			let pair = pairs[i].split('=')
			query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '')
		}
	}

	return query
}

if (query.url) {
	const player = new window.JSMpeg.Player(query.url, {
		source: window.JSMpeg.Source.WebSocket(function () {
			// console.log('Connected to ws')
			player.source.socket.send('client-ready')
		}, function (/*action*/) {
			// console.log('Received server action', action)
		}),
		canvas,
		streaming: true,
		autoplay: true
	})
}
