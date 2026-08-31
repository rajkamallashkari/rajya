require "rails_helper"

RSpec.describe "Session 10.2 push authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 when vapid is denied" do
    user = create(:user)
    stub_deny(WebPushSubscriptionPolicy, :vapid?)
    get "/api/v1/push_subscriptions/vapid", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when create is denied" do
    user = create(:user)
    stub_deny(WebPushSubscriptionPolicy, :create?)
    post "/api/v1/push_subscriptions", headers: auth_headers_for(user),
         params: { endpoint: "https://push.example/x", keys: { p256dh: "k", auth: "a" } }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when destroy is denied" do
    user = create(:user)
    stub_deny(WebPushSubscriptionPolicy, :destroy?)
    delete "/api/v1/push_subscriptions", headers: auth_headers_for(user), params: { endpoint: "https://x" }
    expect(response).to have_http_status(:forbidden)
  end
end
