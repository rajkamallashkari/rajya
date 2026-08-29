# SPA origin allowlist (TARGET §1). GIS and every other browser call hit this.
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins { |source, _env| CorsOrigins.allowed?(source) }

    resource "*",
             headers: :any,
             methods: %i[get post put patch delete options head]
  end
end
