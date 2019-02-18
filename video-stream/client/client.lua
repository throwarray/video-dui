-------------------
--server_ip:port/

local duiURL = "http://192.168.1.142:3000/dui/index.html"
local activationRange = 35.0
local screenCoords = vector3(320.217, 263.81, 82.974)

RegisterCommand('video-stream', function (source, arg, rawInput)
	cinema = GetInteriorAtCoords(320.217, 263.81, 82.974)

	LoadInterior(cinema)
	SetEntityCoords(PlayerPedId(), screenCoords.x, screenCoords.y, screenCoords.z)
end)

-------------------

local scale = 1.5
local screenWidth = math.floor(1280 / scale)
local screenHeight = math.floor(720 / scale)
local shouldDraw = false
local screen = 0
local screenModel = GetHashKey('v_ilev_cin_screen')
local handle = CreateNamedRenderTargetForModel('cinscreen', screenModel)

local txd = Citizen.InvokeNative(GetHashKey("CREATE_RUNTIME_TXD"), 'video', Citizen.ResultAsLong())
local duiObj = Citizen.InvokeNative(GetHashKey('CREATE_DUI'), 'about:blank', screenWidth, screenHeight, Citizen.ResultAsLong())
local dui = Citizen.InvokeNative(GetHashKey('GET_DUI_HANDLE'), duiObj, Citizen.ResultAsString())
local tx = Citizen.InvokeNative(GetHashKey("CREATE_RUNTIME_TEXTURE_FROM_DUI_HANDLE") & 0xFFFFFFFF, txd, 'test', dui, Citizen.ResultAsLong())

Citizen.CreateThread(function ()
	local playerPed
	local playerCoords

	LoadModel(screenModel)
	screen = CreateObjectNoOffset(screenModel,  screenCoords, 0, true, false)
	SetEntityHeading(screen, 179.99998474121)
	SetModelAsNoLongerNeeded(screenModel)

	while true do
		playerPed = PlayerPedId()
		playerCoords = GetEntityCoords(playerPed)

		if GetDistanceBetweenCoords(
			playerCoords.x, playerCoords.y, playerCoords.z,
			screenCoords.x, screenCoords.y, screenCoords.z
		) <= activationRange then
			if not shouldDraw then
				shouldDraw = true
				SetDuiUrl(duiObj, duiURL)
				Wait(500)
			end
		else
			if shouldDraw then
				shouldDraw = false
				SetDuiUrl(duiObj, 'about:blank')
				Wait(500)
			end
		end

		if shouldDraw then
			SetTextRenderId(handle)
			Set_2dLayer(4)
			Citizen.InvokeNative(0xC6372ECD45D73BCD, 1)
			DrawRect(0.5, 0.5, 1.0, 1.0, 0, 0, 0, 255)
			DrawSprite("video", "test", 0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255)
			SetTextRenderId(GetDefaultScriptRendertargetRenderId()) -- reset
			Citizen.InvokeNative(0xC6372ECD45D73BCD, 0)
		end

		Wait(0)
	end
end)

AddEventHandler('onResourceStop', function (resource)
	if resource == GetCurrentResourceName() then
		SetDuiUrl(duiObj, 'about:blank')
		DestroyDui(duiObj)
		Citizen.InvokeNative(0xE9F6FFE837354DD4, 'tvscreen')
		SetEntityAsMissionEntity(screen,  false,  true)
		DeleteObject(screen)
	end
end)
