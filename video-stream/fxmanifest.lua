fx_version "cerulean"
game "gta5"

dependency 'yarn'
lua54 "yes"

client_scripts {
	'client/utils.lua',
	'client/client.lua',
}

server_scripts {
	'server.js'
}

file "public/dui/off.html"
