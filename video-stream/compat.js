if (global.GetResourcePath) {
	// Add __dirname
	global.__dirname = global.GetResourcePath(global.GetCurrentResourceName())

	// Fixes requires
	process.chdir(global.__dirname)

	// Fixes bad browser detection
	delete global.window
}
