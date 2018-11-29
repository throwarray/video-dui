local streamURL = 'ws://192.168.1.142:3000/'
local duiURL = "http://192.168.1.142:3000/dui/index.html"

function CreateNamedRenderTargetForModel(name, model)
	local handle = 0
	if not IsNamedRendertargetRegistered(name) then
		RegisterNamedRendertarget(name, 0)
	end
	if not IsNamedRendertargetLinked(model) then
		LinkNamedRendertarget(model)
	end
	if IsNamedRendertargetRegistered(name) then
		handle = GetNamedRendertargetRenderId(name)
	end

	return handle
end

function RequestTextureDictionary (dict)
	RequestStreamedTextureDict(dict)

	while not HasStreamedTextureDictLoaded(dict) do Citizen.Wait(0) end

	return dict
end;

function LoadModel (model)
	if not IsModelInCdimage(model) then return end

	RequestModel(model)

	while not HasModelLoaded(model) do Citizen.Wait(0) end

	return model
end

function CreateObj (model, coords, ang, networked)
	LoadModel(model)

	local entity = CreateObject(model, coords.x, coords.y, coords.z, networked == true, true, false)

	SetEntityHeading(entity, ang or 0.0)
	SetModelAsNoLongerNeeded(model)

	return entity
end

local scale = 1.5
local screenWidth = math.floor(1280 / scale)
local screenHeight = math.floor(720 / scale)



local screen = 0
local model = GetHashKey('xm_prop_x17dlc_monitor_wall_01a')
local handle = CreateNamedRenderTargetForModel('prop_x17dlc_monitor_wall_01a', model)

local txd = Citizen.InvokeNative(GetHashKey("CREATE_RUNTIME_TXD"), 'video', Citizen.ResultAsLong())
local duiObj = Citizen.InvokeNative(GetHashKey('CREATE_DUI'), duiURL, screenWidth, screenHeight, Citizen.ResultAsLong())
local dui = Citizen.InvokeNative(GetHashKey('GET_DUI_HANDLE'), duiObj, Citizen.ResultAsString())
local tx = Citizen.InvokeNative(GetHashKey("CREATE_RUNTIME_TEXTURE_FROM_DUI_HANDLE") & 0xFFFFFFFF, txd, 'test', dui, Citizen.ResultAsLong())

-- Draw
local mX = 0
local mY = 0

Citizen.CreateThread(function ()
	SetCurrentPedWeapon(PlayerPedId(), GetHashKey("weapon_unarmed"), 1)

	while true do
		BlockWeaponWheelThisFrame()
		SetTextRenderId(handle)
		Set_2dLayer(4)
		Citizen.InvokeNative(0xC6372ECD45D73BCD, 1)
		DrawRect(0.5, 0.5, 1.0, 1.0, 0, 0, 0, 255)
		DrawSprite("video", "test", 0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255)
		DrawSprite('fib_pc', 'arrow', mX / screenWidth, mY / screenHeight, 0.02, 0.02, 0.0, 255, 255, 255, 255)
		SetTextRenderId(GetDefaultScriptRendertargetRenderId()) -- reset
		Citizen.InvokeNative(0xC6372ECD45D73BCD, 0)
		Wait(0)
	end
end)

RegisterCommand('video-stream', function (source, arg, rawInput)
	print('SET DUI URL')

	SendDuiMessage(duiObj, json.encode({
		type = 'play',
		payload = {
			url = streamURL
		}
	}))
end)


Citizen.CreateThread(function ()
	local nX = 0
	local nY = 0

	screen = CreateObj(model,
		{
			x = -1150.3218994141,
			y = 4924.1640625,
			z = 221.38273620605
		},
		270.0,
		false
	)

	RequestTextureDictionary('fib_pc')

	-- Controls
	while true do
		nX = GetControlNormal(0, 239) * screenWidth
		nY = GetControlNormal(0, 240) * screenHeight

		if nX ~= mX or nY ~= mY then
			mX = nX; mY = nY
			SendDuiMouseMove(duiObj, math.floor(mX), math.floor(mY))
		end

		if IsControlPressed(0, 172) then
			SendDuiMouseWheel(duiObj, 10, 0) end -- scroll up
		if IsControlPressed(0, 173) then
			SendDuiMouseWheel(duiObj, -10, 0) end -- scroll down

		if IsControlJustPressed(0, 24) then
			SendDuiMouseDown(duiObj, "left")
			Citizen.Wait(10)
			SendDuiMouseUp(duiObj, "left")

		elseif IsControlJustPressed(0, 25) then
			SendDuiMouseDown(duiObj, "right")
			Citizen.Wait(10)
			SendDuiMouseUp(duiObj, "right")
		end

		Wait(0)
	end
end)

AddEventHandler('onResourceStop', function (resource)
	if resource == GetCurrentResourceName() then
		SendDuiMessage(duiObj, json.encode({
			type = 'play', payload = { url = '' }
		}))
		DestroyDui(duiObj)
		Citizen.InvokeNative(0xE9F6FFE837354DD4, 'tvscreen')
		SetEntityAsMissionEntity(screen,  false,  true)
		DeleteObject(screen)
	end
end)
