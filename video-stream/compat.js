if (global.GetResourcePath) {
	// Add __dirname
	global.__dirname = global.GetResourcePath(global.GetCurrentResourceName())

	// Fixes requires
	process.chdir(global.__dirname)

	// Logger: patches console.log
	const echo = global.console

	global.console = {
		...echo,
		log (...args) {
			for (let i = 0; i < args.length; i++) {
				if (args[i] === void 0) args[i] = 'undefined'
			}

			echo.log(...args)
		}
	}

	// Fixes bad browser detection
	delete global.window
}
