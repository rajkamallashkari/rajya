# CSP and Permissions-Policy sources for the Pages PWA and Tunnel API
# (TARGET §1 cross-origin split, F-31). Request specs assert the emitted
# headers contain these directives.
module SecurityHeaders
  # Rails 8.1's PermissionsPolicy middleware still sets Feature-Policy
  # (`camera 'self'`). F-31 requires the modern Permissions-Policy syntax.
  PERMISSIONS_POLICY = "camera=(self), microphone=(self), display-capture=(self), geolocation=(self), fullscreen=(self), autoplay=(self), payment=(), usb=(), gyroscope=(), accelerometer=(), magnetometer=(), midi=()"

  class Middleware
    def initialize(app)
      @app = app
    end

    def call(env)
      response = @app.call(env)
      response[1]["Permissions-Policy"] = PERMISSIONS_POLICY
      response
    end
  end

  PAGES = "https://rajya.pages.dev"
  OSM_TILES = "https://tile.openstreetmap.org"
  TENOR_API = "https://tenor.googleapis.com"
  TENOR_MEDIA = "https://*.tenor.com"
  R2_STORAGE = "https://*.r2.cloudflarestorage.com"
  R2_PUBLIC = "https://*.r2.dev"
  FONTS_CSS = "https://fonts.googleapis.com"
  FONTS_FILES = "https://fonts.gstatic.com"
  TUNNEL_HTTPS = "https://*.trycloudflare.com"
  TUNNEL_WSS = "wss://*.trycloudflare.com"
  LOCAL_API = "http://localhost:3000"
  LOCAL_API_WS = "ws://localhost:3000"
  LOCAL_LOOPBACK_API = "http://127.0.0.1:3000"
  LOCAL_LOOPBACK_API_WS = "ws://127.0.0.1:3000"

  class << self
    def api_origin
      ENV.fetch("API_ORIGIN", LOCAL_API)
    end

    def cable_origin(http_origin = api_origin)
      http_origin.sub(/\Ahttp/i, "ws")
    end

    def connect_sources
      [
        :self,
        PAGES,
        api_origin,
        cable_origin,
        TUNNEL_HTTPS,
        TUNNEL_WSS,
        LOCAL_API,
        LOCAL_API_WS,
        LOCAL_LOOPBACK_API,
        LOCAL_LOOPBACK_API_WS,
        R2_STORAGE,
        R2_PUBLIC,
        OSM_TILES,
        TENOR_API,
        TENOR_MEDIA,
        FONTS_CSS
      ].uniq
    end

    def img_sources
      [ :self, :data, :blob, R2_STORAGE, R2_PUBLIC, OSM_TILES, TENOR_MEDIA ]
    end

    def media_sources
      [ :self, :blob, R2_STORAGE, R2_PUBLIC, TENOR_MEDIA ]
    end

    def font_sources
      [ :self, :data, FONTS_FILES ]
    end

    def style_sources
      [ :self, :unsafe_inline, FONTS_CSS ]
    end

    def script_sources
      [ :self ]
    end

    def worker_sources
      [ :self, :blob ]
    end
  end
end
