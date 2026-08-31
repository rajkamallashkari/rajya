require "rails_helper"

RSpec.describe "Session 12.1 authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on preferences show when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PreferencePolicy, :show?)
    get "/api/v1/preferences", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on preferences update when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PreferencePolicy, :update?)
    patch "/api/v1/preferences", headers: auth_headers_for(user), as: :json, params: { data: {} }
    expect(response).to have_http_status(:forbidden)
  end
end
