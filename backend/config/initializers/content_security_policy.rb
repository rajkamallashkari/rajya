# frozen_string_literal: true

# Enforced CSP (F-31). connect-src covers Pages, the Tunnel API, Cable,
# R2, OSM tiles, and Tenor — not same-origin only (TARGET §1).
# style-src allows 'unsafe-inline' because React inline style attributes
# are required; applyTheme() writes CSS custom properties, not colour
# attributes (MASTER_PLAN P13).
require Rails.root.join("app/lib/security_headers")

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.object_src :none
    policy.base_uri :self
    policy.frame_ancestors :none
    policy.form_action :self
    policy.manifest_src :self
    policy.script_src(*SecurityHeaders.script_sources)
    policy.style_src(*SecurityHeaders.style_sources)
    policy.font_src(*SecurityHeaders.font_sources)
    policy.img_src(*SecurityHeaders.img_sources)
    policy.media_src(*SecurityHeaders.media_sources)
    policy.connect_src(*SecurityHeaders.connect_sources)
    policy.worker_src(*SecurityHeaders.worker_sources)
  end

  config.content_security_policy_nonce_generator = nil
  config.content_security_policy_nonce_directives = []
  config.content_security_policy_report_only = false

  # Feature-Policy fallback for older browsers; SecurityHeaders::Middleware
  # emits the modern Permissions-Policy header the request spec asserts.
  config.permissions_policy do |policy|
    policy.camera :self
    policy.microphone :self
    policy.display_capture :self
    policy.geolocation :self
    policy.fullscreen :self
    policy.autoplay :self
    policy.payment :none
    policy.usb :none
    policy.gyroscope :none
    policy.accelerometer :none
    policy.magnetometer :none
    policy.midi :none
  end
end
