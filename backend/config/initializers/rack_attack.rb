# Rate limits from app_settings (TARGET §4.7). Discriminators live in
# RateLimits so they stay unit-testable; this initializer only waits until
# Zeitwerk can load `app/lib` and then wires Rack::Attack.
Rails.application.config.after_initialize do
  RateLimits.apply!
end
