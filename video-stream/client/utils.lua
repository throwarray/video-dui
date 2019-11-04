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
end

function LoadModel (model)
	if not IsModelInCdimage(model) then return end

	RequestModel(model)

	while not HasModelLoaded(model) do Citizen.Wait(0) end

	return model
end

-- splits a network address to ip, port compatible with IPv4 and IPv6
function SplitHostPort(host)
    local address, port

    -- if starts with '[' assume it's IPv6
    -- https://tools.ietf.org/html/rfc2732
    if host:sub(1, 1) == '[' then
        -- first ']' before the last ':'
        local bracket = host:find(']')

        port = host:sub(bracket + 2)
        address = host:sub(2, bracket + 1)
    else
        -- just split ':' in IPv4
        local colon = host:find(':')

        port = host:sub(colon + 1)
        address = host:sub(1, colon - 1)
    end

    return address, port
end
