const path = require('path')
const resourcePath = global.GetResourcePath?
	global.GetResourcePath(global.GetCurrentResourceName()) : global.__dirname

require('dotenv').config({ path: path.join(resourcePath, './.env') })

const http = require('http')
const WebSocket = require('ws')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const { spawn } = require('child_process')
const { path: ffmpegPath } = require('ffmpeg-static')
const nms = require(path.join(resourcePath, './rtmp.js'))

const PORT = process.env.PORT || 3000
const STREAM_PATH = process.env.STREAM_NAME ||
	`rtmp://localhost:${process.env.RTMP_PORT}/live/STREAM_NAME`

let ffmpegProc
let published = false

function getVideoSource () {
	ffmpegProc = spawn(ffmpegPath, [
		'-loglevel', 'error',
		'-re',
		'-i', STREAM_PATH,
		'-f', 'mpegts',
		'-c:a', 'mp2',
		'-c:v', 'mpeg1video',
		'pipe:1'
	], { stdio: ['pipe', 'pipe', process.stderr] })
	return ffmpegProc.stdout
}

// HTTP Server for dui scripts
const serve = serveStatic(path.join(resourcePath, './public'), {
	index: ['index.html']
})

const server = http.createServer(function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With')
	serve(req, res, finalhandler(req, res))
})

// Websocket Server to relay video data
let wss = new WebSocket.Server({ server, perMessageDeflate: false })

wss.connectionCount = 0
wss.broadcast = function(data) {
	wss.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data)
		}
	})
}

wss.on('connection', function(socket /*, upgradeReq*/) {
	wss.connectionCount++

	console.log('Streamer Connection: ', '('+wss.connectionCount+' total)')

	socket.on('close', function(/* code, message */){
		wss.connectionCount--
		console.log('Streamer disconnected ('+wss.connectionCount+' total)')
	})

	socket.send(JSON.stringify({
		type: 'video-stream:join',
		payload: {}
	}))

	//socket.on('message', function (msg) {})
})

// Start http server
server.listen(PORT, function () {
	console.log('[video-stream] resource: http://127.0.0.1:'+ PORT)

	// Start rtmp server
	nms.run()

	// Stream in use
	nms.on('prePublish', (id /*, streamPath, args*/) => {
		const session = nms.getSession(id)

		if (published) {
			console.log('video-stream stream already in use.')

			return session.reject()
		}
	})

	// Handle video publish
	nms.on('postPublish', () => {
		if (!published) {
			published = true

			console.log('video-stream stream started.')

			setImmediate(function () {
				// Process video with ffmpeg
				const screenStream = getVideoSource()

				wss.broadcast((JSON.stringify({ type: 'video-stream:open', payload: {} })))

				// Send video to consummers
				screenStream.on('readable', ()=> {
					const data = screenStream.read()

					wss.broadcast(data)
				})
			})
		}
	})

	// Stream was ended
	nms.on('donePublish', (/*id*/) => {
		if (published) {
			ffmpegProc.kill()
			ffmpegProc = null
			published = false

			wss.broadcast((JSON.stringify({ type: 'video-stream:close', payload: {} })))

			console.log('video-stream stream stopped.')
		}
	})
})
