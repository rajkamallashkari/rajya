require "rails_helper"

# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations -- F-31 header contract
RSpec.describe "Security headers", type: :request do
  it "sends an enforced CSP covering Pages, Cable, R2, OSM, and Tenor" do
    get "/up"

    expect(response).to have_http_status(:ok)
    expect(response.headers["Content-Security-Policy-Report-Only"]).to be_blank
    csp = response.headers["Content-Security-Policy"]
    expect(csp).to be_present
    expect(csp).to include("rajya.pages.dev")
    expect(csp).to include("wss:")
    expect(csp).to include("r2.cloudflarestorage.com")
    expect(csp).to include("tile.openstreetmap.org")
    expect(csp).to include("tenor.googleapis.com")
    expect(csp).to include("tenor.com")
    expect(csp).to include("script-src 'self'")
    expect(csp).not_to include("unsafe-eval")
  end

  it "sends a Permissions-Policy that grants capture APIs to self only" do
    get "/up"

    policy = response.headers["Permissions-Policy"]
    expect(policy).to be_present
    expect(policy).to include("camera=(self)")
    expect(policy).to include("microphone=(self)")
    expect(policy).to include("display-capture=(self)")
    expect(policy).to include("geolocation=(self)")
    expect(policy).to include("payment=()")
  end

  it "allows the same origins on Action Cable as CORS" do
    expect(ActionCable.server.config.allowed_request_origins).to eq(CorsOrigins.list)
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
