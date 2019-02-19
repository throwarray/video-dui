-------------------
--server_ip:port/
local streamURL = "http://192.168.1.142:3000/dui/index.html"
local streamOfflineURL = "http://192.168.1.142:3000/dui/off.html"

RegisterCommand('video-stream', function (source, arg, rawInput)
	SetEntityCoords(PlayerPedId(), 320.217, 263.81, 82.974)
	SetEntityHeading(PlayerPedId(), 180.0)
end)

-------------------

local scale = 1.5
local screenWidth = math.floor(1280 / scale)
local screenHeight = math.floor(720 / scale)
local screenEntity = 0
local screenModel = GetHashKey('v_ilev_cin_screen')
local handle = CreateNamedRenderTargetForModel('cinscreen', screenModel)

local txd = Citizen.InvokeNative(GetHashKey("CREATE_RUNTIME_TXD"), 'video', Citizen.ResultAsLong())
local duiObj = Citizen.InvokeNative(GetHashKey('CREATE_DUI'), streamOfflineURL, screenWidth, screenHeight, Citizen.ResultAsLong())
local dui = Citizen.InvokeNative(GetHashKey('GET_DUI_HANDLE'), duiObj, Citizen.ResultAsString())
local tx = Citizen.InvokeNative(GetHashKey("CREATE_RUNTIME_TEXTURE_FROM_DUI_HANDLE") & 0xFFFFFFFF, txd, 'test', dui, Citizen.ResultAsLong())
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


Citizen.CreateThread(function ()
	local playerPed
	local playerCoords
	local inRange = false
	local screenCoords = vector3(320.1257, 248.6608, 86.56934)
	local cinemaIpl = GetInteriorAtCoords(320.217, 263.81, 82.974)
	local cinemaRoom = -1337806789

	-- Give time for resource to start
	Wait(3500)

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
			Citizen.InvokeNative(0xC6372ECD45D73BCD, 1)
			DrawRect(0.5, 0.5, 1.0, 1.0, 0, 0, 0, 255)
			DrawSprite("video", "test", 0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255)
			SetTextRenderId(GetDefaultScriptRendertargetRenderId()) -- reset
			Citizen.InvokeNative(0xC6372ECD45D73BCD, 0)
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
		Citizen.InvokeNative(0xE9F6FFE837354DD4, 'tvscreen')
		SetEntityAsMissionEntity(screenEntity, false, true)
		DeleteObject(screenEntity)
	end
end)
