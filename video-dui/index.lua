local visits = 0

STATIC_FOLDER = 'static/'

FILE_CACHE = {
  -- ['/style.css'] = true
}

function Log (...)
  print('\27[32m['.. GetCurrentResourceName() ..']\27[0m', ...)
end

ROUTES = {
  ['/404.html'] = function (req, res)
    res.writeHead(404)
    res.send('404: Page not found.')
  end
}
