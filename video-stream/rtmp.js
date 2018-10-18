require(require.resolve('./compat.js'))

const secret = process.env.RTMP_SECRET || 'secret'
const port = process.env.RTMP_PORT || 1935
const { NodeMediaServer } = require('node-media-server')
const config = {
	rtmp: {
		port,
		chunk_size: 60000,
		gop_cache: true,
		ping: 60,
		ping_timeout: 30
	}
}

const nms = new NodeMediaServer(config)

nms.on('prePublish', (id , streamPath, args) => {
	const session = nms.getSession(id)

	console.log('PREPUBLISH FROM ID', id, streamPath)

	if (args.secret !== secret) {
		session.reject()
	}
})

nms.run()
