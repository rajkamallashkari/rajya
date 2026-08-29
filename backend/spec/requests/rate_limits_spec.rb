require "rails_helper"

RSpec.describe "Auth rate limits", type: :request do
  def exceed!(path, params: {})
    post path, params: params
    post path, params: params
  end

  def stub_limit(key, value)
    create(:app_setting, key: key.to_s, value: value, category: "auth")
  end

  it "returns 429 on the login path once the IP limit is exceeded" do
    stub_limit(:rate_limit_login_attempts, 1)
    exceed!("/auth/login", params: { email: "a@example.com" })

    expect(response).to have_http_status(:too_many_requests)
    expect(response.parsed_body.dig("error", "code")).to eq("rate_limited")
  end

  it "returns 429 on passkey authentication once the IP limit is exceeded" do
    stub_limit(:rate_limit_login_attempts, 1)
    exceed!("/auth/passkeys/authenticate")

    expect(response).to have_http_status(:too_many_requests)
  end

  it "returns 429 on OTP issuance once the destination limit is exceeded" do
    stub_limit(:rate_limit_otp_issuance, 1)
    exceed!("/auth/otp/request", params: { email: "a@example.com" })

    expect(response).to have_http_status(:too_many_requests)
  end

  it "returns 429 on OTP verification once the attempt limit is exceeded" do
    stub_limit(:rate_limit_otp_verification, 1)
    exceed!("/auth/otp/verify")

    expect(response).to have_http_status(:too_many_requests)
  end

  it "returns 429 on registration once the IP limit is exceeded" do
    stub_limit(:rate_limit_registration, 1)
    exceed!("/auth/register")

    expect(response).to have_http_status(:too_many_requests)
  end

  it "returns 429 on message posts once the per-account limit is exceeded" do
    stub_limit(:rate_limit_messages, 1)
    exceed!("/api/v1/messages")

    expect(response).to have_http_status(:too_many_requests)
  end

  it "returns 429 on general API traffic once the per-account limit is exceeded" do
    stub_limit(:rate_limit_api_general, 10)
    11.times { get "/api/v1/me" }

    expect(response).to have_http_status(:too_many_requests)
  end

  it "does not throttle liveness or readiness" do
    stub_limit(:rate_limit_login_attempts, 1)
    exceed!("/auth/login")

    get "/up"
    expect(response).to have_http_status(:ok)

    get "/health"
    expect(response).not_to have_http_status(:too_many_requests)
  end
end
