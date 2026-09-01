# frozen_string_literal: true

# Cable allowlist matches CORS (TARGET §1). Set after autoload so CorsOrigins
# is available — the CORS middleware already resolves it per request.
Rails.application.config.after_initialize do
  ActionCable.server.config.allowed_request_origins = CorsOrigins.list
end
