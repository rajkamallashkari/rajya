require "rails_helper"

RSpec.describe "CORS", type: :request do
  it "allows the SPA origin on an unauthenticated endpoint" do
    get "/health", headers: { "Origin" => "http://localhost:5173" }

    expect(response.headers["Access-Control-Allow-Origin"]).to eq("http://localhost:5173")
  end

  it "omits the allow-origin header for an unknown origin" do
    get "/health", headers: { "Origin" => "https://evil.example" }

    expect(response.headers["Access-Control-Allow-Origin"]).to be_nil
  end
end
