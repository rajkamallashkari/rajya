# Allowlist for the cross-origin SPA (TARGET §1). Pages in production,
# localhost in development, trycloudflare tunnels for phone testing.
module CorsOrigins
  PAGES = "https://rajya.pages.dev"
  LOCALHOST = "http://localhost:5173"
  LOOPBACK = "http://127.0.0.1:5173"
  TUNNEL = /\Ahttps:\/\/[a-z0-9-]+\.trycloudflare\.com\z/

  class << self
    def list
      [ frontend_origin, LOCALHOST, LOOPBACK, PAGES, TUNNEL ].uniq
    end

    def allowed?(origin)
      return false if origin.blank?

      list.any? { |item| item.is_a?(Regexp) ? item.match?(origin) : item == origin }
    end

    def frontend_origin
      ENV.fetch("FRONTEND_ORIGIN", LOCALHOST)
    end
  end
end
