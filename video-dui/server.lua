--------------------------------------------------------------------------------

-- Defaults

STATIC_FOLDER = 'static/'

ROUTES = { }

FILE_CACHE = { }

PRINT_NAME = '\27[32m['.. GetCurrentResourceName() ..']\27[0m'

function Log (...)
    print(PRINT_NAME, ...)
end

-- Decode query string
local function _decodeQuery1 (h)
  return string.char(tonumber(h, 16))
end

local function _decodeQuery (s)
  s = s:gsub('+', ' '):gsub('%%(%x%x)', _decodeQuery1)

  return s
end

function DecodeQueryParams (str)
  local query = {}

  for k,v in str:gmatch('([^&=?]-)=([^&=?]+)' ) do
    query[k] = _decodeQuery(v)
  end

  return query
end

-- Split the path and query string
function SplitQueryString (s)
  local url = {
    path = s;
    query = nil;
  }

  for k,v in s:gmatch('(.+)?(.+)') do
    url.path = k
    url.query = v

    break
  end

  return url
end

--------------------------------------------------------------------------------

function PageNotFound (req, res, ...)
    local handler = ROUTES['/404.html']

    -- Try 404 from ROUTES
    if handler then handler(req, res, ...)

    -- Generic 404 handler
    else
        res.writeHead(404)
        res.send('Not found.')
    end
end

-- Serve /static file
function SendFile (req, res, ...)
    -- Send from cache

    local filepath = req.path
    local cached = FILE_CACHE[filepath]

    if cached and cached ~= true then
        Log('serve from cache', filepath)

        res.send(FILE_CACHE[filepath])

        return
    end

    -- Load the file
    local data
    local file = io.open(GetResourcePath(GetCurrentResourceName()) .. '/' .. STATIC_FOLDER .. filepath, "r")

    if file then
      res.writeHead(200)
      io.input(file)
      data = io.read("*a")
      io.close(file)
    end

    -- Is the file being cached
    if cached == true then
        Log('save to cache', filepath)
        FILE_CACHE[filepath] = data
    end

    -- 404
    if not data then
        Log('serve 404', filepath)
        PageNotFound(req, res, ...)

    -- Send the file
    else
        res.send('' .. data)
    end
end

-- Handle dynamic route
function HandleRoute (req, res, ...)
    local extra = { ... }

    Log('handle request as', req.path, req.query)

    if req.query ~= nil then
      -- Parse request query params for all routes
      req.query = DecodeQueryParams(req.query)
    end

    if req.method == 'POST' then
        -- Parse request body for post requests
        req.setDataHandler(function (body)
            req.body = json.decode(body)

            -- Handle route
            ROUTES[req.path](req, res, table.unpack(extra))
        end)
    else
       ROUTES[req.path](req, res, table.unpack(extra))
    end
end

-- Incomming request
SetHttpHandler(function (req, res)
    -- Trim the query
    local url = SplitQueryString(req.path)

    req.path = url.path
    req.query = url.query

    -- Log incomming request
    Log('incomming request for', req.path, req.query)

    -- Handle dynamic routes
    if ROUTES[req.path] then HandleRoute(req, res) return end

    -- Special case handle / is /index.html
    if req.path == '/' then req.path = '/index.html' end

    if ROUTES[req.path] then HandleRoute(req, res)

    -- Handle the request as static serve
    else
        Citizen.CreateThread(function ()
            Wait(0)
            SendFile(req, res)
        end)
    end
end)
