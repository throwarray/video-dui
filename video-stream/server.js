require(require.resolve('./compat.js'))
require('dotenv').config()

const path = require('path')
const http = require('http')
const WebSocket = require('ws')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const { spawn } = require('child_process')
const { path: ffmpegPath } = require('ffmpeg-static')
const nms = require('./rtmp.js')

const PORT = process.env.PORT || 3000
const STREAM_PATH = process.env.STREAM_NAME ||
	`rtmp://localhost:${process.env.RTMP_PORT}/live/STREAM_NAME`

function getVideoSource () {
	var proc = spawn(ffmpegPath, [
		'-loglevel', 'error',
		'-re',
		'-i', STREAM_PATH,
		'-f', 'mpegts',
		'-c:a', 'mp2',
		'-c:v', 'mpeg1video',
		'pipe:1'
	], { stdio: ['pipe', 'pipe', process.stderr] })
	return proc.stdout
}

let wss
const serve = serveStatic(path.join(__dirname, './public'), {
	index: ['index.html']
})

const server = http.createServer(function(req, res) {
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With')
	serve(req, res, finalhandler(req, res))
})

// Websocket Server
wss = new WebSocket.Server({ server, perMessageDeflate: false })

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

	console.log(
		'WebSocket Connection: ',
		// (upgradeReq || socket.upgradeReq).socket.remoteAddress,
		// (upgradeReq || socket.upgradeReq).headers['user-agent'],
		'('+wss.connectionCount+' total)'
	)

	socket.send('Welcome')

	socket.on('message', function (/*msg*/) {
		// console.log('RECEIVED MESSAGE', msg)
	})

	socket.on('close', function(/* code, message */){
		wss.connectionCount--
		console.log(
			'Disconnected WebSocket ('+wss.connectionCount+' total)'
		)
	})
})

server.listen(PORT, function () {
	console.log('[video-stream] resource: http://127.0.0.1:'+ PORT)

	nms.run()

	let published = false

	nms.on('postPublish', (/*id, StreamPath, args */) => {
		if (!published) { // StreamPath /live/STREAM_NAME
			published = true
			setImmediate(function () {
				const screenStream = getVideoSource()

				screenStream.on('readable', ()=> {
					const data = screenStream.read()

					wss.broadcast(data)
				})
			})
		}
	})
})
