require(require.resolve('./compat.js'))
require('dotenv').config()

const port = process.env.PORT || 3000
const path = require('path')
const http = require('http')
const WebSocket = require('ws')
const { spawn } = require('child_process')
const { path: ffmpegPath } = require('ffmpeg-static')

function getVideoSource () {
	var proc = spawn(ffmpegPath, [
		'-loglevel', 'error',
		'-re',
		'-i', 'rtmp://localhost:1935/live/NOT_STREAM_NAME',
		'-f', 'mpegts',
		'-c:a', 'mp2',
		'-c:v', 'mpeg1video',
		'pipe:1'
	], { stdio: ['pipe', 'pipe', process.stderr] })
	return proc.stdout
}

const screenStream = getVideoSource()

screenStream.on('readable', () => {
	const data = screenStream.read()

	wss.broadcast(data)
})


let wss
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
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

wss.on('connection', function(socket, upgradeReq) {
	wss.connectionCount++
	console.log(
		'New WebSocket Connection: ',
		(upgradeReq || socket.upgradeReq).socket.remoteAddress,
		(upgradeReq || socket.upgradeReq).headers['user-agent'],
		'('+wss.connectionCount+' total)'
	)

	socket.send('Welcome')

	socket.on('message', function (msg) {
		console.log('RECEIVED MESSAGE', msg)
	})


	socket.on('close', function(/* code, message */){
		wss.connectionCount--
		console.log(
			'Disconnected WebSocket ('+wss.connectionCount+' total)'
		)
	})
})


server.listen(port, function () {
	console.log('[video-stream] resource: http://127.0.0.1:'+ port)
})
