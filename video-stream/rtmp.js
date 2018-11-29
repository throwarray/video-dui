require(require.resolve('./compat.js'))
require('dotenv').config()

const secret = process.env.RTMP_SECRET || 'secret'
const port = process.env.RTMP_PORT || 1935
const { NodeMediaServer } = require('node-media-server')

const nms = new NodeMediaServer({
	logType: 1,
	rtmp: {
		port,
		allow_origin: '*',
		chunk_size: 60000,
		gop_cache: true,
		ping: 60,
		ping_timeout: 30
	}
})

nms.on('prePublish', (id , streamPath, args) => {
	const session = nms.getSession(id)

	if (args.secret !== secret) {
		session.reject()
	} else {
		// console.log('PREPUBLISH FROM ID', id, streamPath)
	}
})


module.exports = nms
