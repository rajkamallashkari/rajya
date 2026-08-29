# Rack::Attack discriminators and wiring (TARGET §4.7 / F-2). Limits and
# windows come from Settings.fetch so an admin override takes effect without
# a deploy. `apply!` is called once from the initializer; discriminators are
# also unit-tested directly.
module RateLimits
  MINUTE_IN_SECONDS = 60

  AUTH_LOGIN = "/auth/login"
  AUTH_REGISTER = "/auth/register"
  AUTH_GOOGLE = "/auth/google"
  AUTH_OTP_REQUEST = "/auth/otp/request"
  AUTH_OTP_VERIFY = "/auth/otp/verify"
  AUTH_MAGIC_REQUEST = "/auth/magic_link/request"
  AUTH_MAGIC_VERIFY = "/auth/magic_link/verify"
  AUTH_FORGOT = "/auth/forgot_password"
  AUTH_RESET = "/auth/reset_password"
  AUTH_PASSKEY_OPTIONS = "/auth/passkeys/authentication_options"
  AUTH_PASSKEY_AUTHENTICATE = "/auth/passkeys/authenticate"
  API_MESSAGES = "/api/v1/messages"
  API_PREFIX = "/api/"
  BEARER = "Bearer"

  module_function

  def apply!
    Rack::Attack.cache.store = Rails.cache
    safelists!
    throttles!
    responder!
  end

  def safelisted?(req)
    path = req.path
    path == "/up" || path == "/health" || path.start_with?("/api-docs") || path.start_with?("/webhooks/")
  end

  def login_ip(req)
    req.ip if post_one_of?(req, AUTH_LOGIN, AUTH_GOOGLE, AUTH_PASSKEY_OPTIONS, AUTH_PASSKEY_AUTHENTICATE)
  end

  def login_account(req)
    return unless post_path?(req, AUTH_LOGIN)

    param(req, "email")&.downcase
  end

  def registration_ip(req)
    req.ip if post_path?(req, AUTH_REGISTER)
  end

  def otp_issuance_destination(req)
    return unless post_one_of?(req, AUTH_OTP_REQUEST, AUTH_MAGIC_REQUEST, AUTH_FORGOT)

    (param(req, "email") || param(req, "destination"))&.downcase
  end

  def otp_verification_ip(req)
    req.ip if post_one_of?(req, AUTH_OTP_VERIFY, AUTH_MAGIC_VERIFY, AUTH_RESET)
  end

  def messages(req)
    return unless post_path?(req, API_MESSAGES)

    jwt_account_id(req) || req.ip
  end

  def api_general(req)
    return unless req.path.start_with?(API_PREFIX)

    jwt_account_id(req) || req.ip
  end

  def jwt_account_id(req)
    header = req.get_header("HTTP_AUTHORIZATION")
    return if header.blank?

    scheme, token = header.split(" ", 2)
    return unless scheme.to_s.casecmp(BEARER).zero?

    payload = Auth::Token.decode(token)
    id = payload["account_id"].to_i
    id.positive? ? id.to_s : nil
  rescue Auth::Token::DecodeError
    nil
  end

  def param(req, key)
    if json_request?(req)
      json_body(req)[key].to_s.presence
    else
      req.params[key].to_s.presence
    end
  end

  def json_request?(req)
    req.content_type.to_s.include?("application/json")
  end

  def json_body(req)
    raw = req.body.read
    req.body.rewind
    return {} if raw.blank?

    parsed = JSON.parse(raw)
    parsed.is_a?(Hash) ? parsed : {}
  rescue JSON::ParserError
    {}
  ensure
    req.body.rewind
  end

  def post_path?(req, path)
    req.post? && req.path == path
  end

  def post_one_of?(req, *paths)
    req.post? && paths.include?(req.path)
  end

  def safelists!
    Rack::Attack.safelist("operational") { |req| safelisted?(req) }
  end

  def throttles!
    throttle("auth/login/ip", :rate_limit_login_attempts, :rate_limit_login_period, :login_ip)
    throttle("auth/login/account", :rate_limit_login_attempts, :rate_limit_login_period, :login_account)
    throttle("auth/register/ip", :rate_limit_registration, :rate_limit_registration_period, :registration_ip)
    throttle("auth/otp/issuance", :rate_limit_otp_issuance, :rate_limit_otp_issuance_period, :otp_issuance_destination)
    throttle("auth/otp/verify", :rate_limit_otp_verification, :rate_limit_otp_issuance_period, :otp_verification_ip)
    throttle("api/messages", :rate_limit_messages, nil, :messages)
    throttle("api/general", :rate_limit_api_general, nil, :api_general)
  end

  def throttle(name, limit_key, period_key, discriminator)
    Rack::Attack.throttle(
      name,
      limit: ->(_req) { Settings.fetch(limit_key) },
      period: ->(_req) { period_key ? Settings.fetch(period_key) : MINUTE_IN_SECONDS }
    ) { |req| public_send(discriminator, req) }
  end

  def responder!
    Rack::Attack.throttled_responder = lambda do |_request|
      [
        429,
        { "content-type" => "application/json" },
        [ Errors.render(:rate_limited).to_json ]
      ]
    end
  end
end
