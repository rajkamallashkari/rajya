require "rails_helper"

RSpec.describe "Legacy Google redirect", type: :request do
  it "does not expose GET /google/callback so a JWT cannot land in a query string (F-25)" do
    get "/google/callback"

    expect(response).to have_http_status(:not_found)
  end
end
