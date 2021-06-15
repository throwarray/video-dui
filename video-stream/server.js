const path = require('path')
const resourcePath = global.GetResourcePath?
	global.GetResourcePath(global.GetCurrentResourceName()) : global.__dirname

require('dotenv').config({ path: path.join(resourcePath, './.env') })

const http = require('http')
const WebSocket = require('ws')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const { spawn } = require('child_process')
const ffmpegPath = process.env.FFMPEG_PATH || require('ffmpeg-static')
const NodeMediaServer = require('node-media-server')

const RTMP_ENABLED = process.env.RTMP_ENABLED || 0
const RTMP_PORT = process.env.RTMP_PORT || 1935
const RTMP_SECRET = process.env.RTMP_SECRET || 'secret'
const PORT = process.env.PORT || 3000
const STREAM_PATH = process.env.STREAM_PATH ||
	`rtmp://localhost:${RTMP_PORT}/live/STREAM_NAME`

let streamProc
let published = false

// Process stream source
function VideoStream (filePath = STREAM_PATH) {
	const stream = spawn(ffmpegPath, [
		'-loglevel', 'error',
		'-re',
		'-i', filePath,
		'-f', 'mpegts',
		'-c:a', 'mp2',
		'-c:v', 'mpeg1video',
		'pipe:1'
	], { stdio: ['pipe', 'pipe', process.stderr] })

	return stream
}

// HTTPServer for DUI scripts
const serve = serveStatic(path.join(resourcePath, './public'), {
	index: ['index.html']
})

const server = http.createServer(function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With')
	serve(req, res, finalhandler(req, res))
})

// WebsocketServer to relay video data
const wss = new WebSocket.Server({ server, perMessageDeflate: false })

wss.connectionCount = 0
wss.broadcast = function(data) {
	wss.clients.forEach(function each(client) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data)
		}
	})
}

// Streamer connected
wss.on('connection', function(socket /*, upgradeReq*/) {
	wss.connectionCount++

	console.log('Streamer Connection: ', '('+wss.connectionCount+' total)')

	socket.on('close', function(/* code, message */) {
		if (wss.connectionCount > 0) {
			wss.connectionCount--
			console.log('Streamer disconnected ('+wss.connectionCount+' total)')
		}
	})

	socket.send(JSON.stringify({
		type: 'video-stream:join',
		payload: { published }
	}))

	// Handle client messages
	socket.on('message', function (/*msg*/) {})
})

// Stream was started
function onPostPublish (stream) {
	if (published) return

	published = true

	console.log('video-stream stream started.')

	setImmediate(function () {
		// Process video with ffmpeg
		if(!stream) stream = VideoStream(STREAM_PATH)

		wss.broadcast((JSON.stringify({ type: 'video-stream:open' })))

		if (global.emitNet)
			global.emitNet('video-stream:status', -1, published)

		// Send video to consummers
		streamProc = stream
		stream = stream.stdout

		stream.on('readable', ()=> {
			const data = stream.read()

			wss.broadcast(data)
		})
	})
}

// Stream was ended
function onDonePublish (stream) {
	if (published) {
		if (stream) stream.kill()

		published = false
		streamProc = null

		wss.broadcast((JSON.stringify({ type: 'video-stream:close' })))

		if (global.emitNet) setImmediate(function () {
			global.emitNet('video-stream:status', -1, published)
		})

		console.log('video-stream stream stopped.')
	}
}

// Start http server
server.listen(PORT, function () {
	console.log('[video-stream] httpServer started',
		'http://127.0.0.1:'+ PORT + '/dui/index.html'
	)

	// Start optional rtmp server
	if (RTMP_ENABLED) {
		console.log('[video-stream] rtmpServer started', STREAM_PATH)

		const nms = new NodeMediaServer({
			logType: 1,
			rtmp: {
				port: RTMP_PORT,
				allow_origin: '*',
				chunk_size: 60000,
				gop_cache: true,
				ping: 60,
				ping_timeout: 30
			}
		})

		nms.run()

		nms.on('prePublish', (id, streamPath, args) => {
			const session = nms.getSession(id)

			// FIXME
			if (args.secret !== RTMP_SECRET) {
				session.reject()

				return
			}

			if (published) {
				console.log('video-stream stream already in use.')

				return session.reject()
			}
		})

		nms.on('postPublish', () => { onPostPublish() })

		nms.on('donePublish', (/*id*/) => { onDonePublish(streamProc) })
	}
})

if (global.RegisterCommand) {
	// Check stream status
	global.onNet('video-stream:status', function () {
		const src = global.source
		setImmediate(function () {
			global.emitNet('video-stream:status', src, published)
		})
	})

	// Add command to set stream from path (non obs source)
	global.RegisterCommand('video-stream:set', function (src, arg) {
		if (streamProc) streamProc.kill()

		if (arg[0]) {
			streamProc = VideoStream(arg[0])
			streamProc.on('close', function () { onDonePublish() })
			onPostPublish(streamProc)
		}
	}, true)
}
