require "rails_helper"

RSpec.describe "Session 12.2 authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on conversation wallpaper when organize is denied (F-1)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :organize?)
    patch "/api/v1/conversations/#{conversation.id}/wallpaper",
          headers: auth_headers_for(user), as: :json, params: { wallpaper: { preset: "dusk" } }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on font catalogue index when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(FontConfigPolicy, :index?)
    get "/api/v1/font_configs", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on accent catalogue index when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(GlobalAccentConfigPolicy, :index?)
    get "/api/v1/accent_configs", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end
end
