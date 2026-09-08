require "rails_helper"

RSpec.describe "CORS", type: :request do
  it "allows the SPA origin on an unauthenticated endpoint" do
    get "/health", headers: { "Origin" => "http://localhost:5173" }

    expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:5173")
    expect(response.headers["Access-Control-Allow-Credentials"]).to eq("true")
  end

  it "omits the allow-origin header for an unknown origin" do
    get "/health", headers: { "Origin" => "https://evil.example" }

    expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
  end

  it "answers a browser preflight from the SPA" do
    process :options, "/auth/login", headers: {
      "Origin" => "http://localhost:5173",
      "Access-Control-Request-Method" => "POST",
      "Access-Control-Request-Headers" => "content-type,authorization"
    }

    expect(response).to have_http_status(:ok)
    expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:5173")
    expect(response.headers["Access-Control-Allow-Headers"].to_s).to match(/authorization/i)
  end
end
