RegisterCommand('video-stream', function (source, arg, rawInput)
	SetEntityCoords(PlayerPedId(), 320.217, 263.81, 82.974)
	SetEntityHeading(PlayerPedId(), 180.0)
end)

-------------------

local streamOfflineURL <const> = string.format("https://cfx-nui-%s/public/dui/off.html", GetCurrentResourceName())

local scale = 1.5
local screenWidth = math.floor(1280 / scale)
local screenHeight = math.floor(720 / scale)
local screenEntity = 0
local screenModel = GetHashKey('v_ilev_cin_screen')
local handle = CreateNamedRenderTargetForModel('cinscreen', screenModel)

local txd = CreateRuntimeTxd('video')
local duiObj = CreateDui(streamOfflineURL, screenWidth, screenHeight)
local dui = GetDuiHandle(duiObj)
local tx = CreateRuntimeTextureFromDuiHandle(txd, 'test', dui)
local streamOnline = false

-- Receive status event
RegisterNetEvent('video-stream:status')
AddEventHandler('video-stream:status', function (active)
	if active then
		print('[video-stream] stream online')
		streamOnline = true
	else
		print('[video-stream] stream offline')
		streamOnline = false
	end
end)

local duiURL

function getDuiURL () return duiURL end

function setDuiURL (url)
	duiURL = url

	SetDuiUrl(duiObj, url)
end


CreateThread(function ()
	local playerPed
	local playerCoords
	local inRange = false
	local screenCoords = vector3(320.1257, 248.6608, 86.56934)
	local cinemaIpl = GetInteriorAtCoords(320.217, 263.81, 82.974)
	local cinemaRoom = -1337806789

	-- Give time for resource to start
	Wait(3500)

	-- Gather the stream url
	local endpoint = SplitHostPort(GetCurrentServerEndpoint())

	local port = GetConvarInt("video_stream_port", 3000)
	local streamURL = string.format("http://%s:%d/dui/index.html", endpoint, port)

	-- Check stream status
	TriggerServerEvent('video-stream:status')
	LoadInterior(cinemaIpl)

	-- Create cinema screen
	if not DoesEntityExist(GetClosestObjectOfType(screenCoords.x, screenCoords.y, screenCoords.z, 10.0, screenModel, false, false, false)) then
		LoadModel(screenModel)
		screenEntity = CreateObjectNoOffset(screenModel, screenCoords.x, screenCoords.y, screenCoords.z, 0, true, false)
		SetEntityHeading(screenEntity, 180.0)
	 	SetEntityCoords(screenEntity, GetEntityCoords(screenEntity))
		SetModelAsNoLongerNeeded(screenModel)
	end

	while true do
		playerPed = PlayerPedId()
		playerCoords = GetEntityCoords(playerPed)
		inRange = GetInteriorFromEntity(playerPed) == cinemaIpl and GetKeyForEntityInRoom(playerPed) == cinemaRoom

		if streamOnline and inRange then
			if getDuiURL() ~= streamURL then
				setDuiURL(streamURL)
				Wait(1000)
			end
		else
			if getDuiURL() ~= streamOfflineURL then
				setDuiURL(streamOfflineURL)
			end
		end

		-- Check distance between player and screen
		if inRange then
			-- Draw screen in range
			SetTextRenderId(handle)
			Set_2dLayer(4)
			SetScriptGfxDrawBehindPausemenu(1)
			DrawRect(0.5, 0.5, 1.0, 1.0, 0, 0, 0, 255)
			DrawSprite("video", "test", 0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255)
			SetTextRenderId(GetDefaultScriptRendertargetRenderId()) -- reset
			SetScriptGfxDrawBehindPausemenu(0)
		else
			if getDuiURL() ~= streamOfflineURL then
				setDuiURL(streamOfflineURL)
			end
		end

		Wait(0)
	end
end)

-- Cleanup
AddEventHandler('onResourceStop', function (resource)
	if resource == GetCurrentResourceName() then
		SetDuiUrl(duiObj, 'about:blank')
		DestroyDui(duiObj)
		ReleaseNamedRendertarget('tvscreen')
		SetEntityAsMissionEntity(screenEntity, false, true)
		DeleteObject(screenEntity)
	end
end)
