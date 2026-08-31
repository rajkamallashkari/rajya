require "rails_helper"

RSpec.describe "Session 8.1 search authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on global search when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(SearchPolicy, :index?)
    get "/api/v1/search", headers: auth_headers_for(user), params: { q: "ab" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on people search when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(AccountPolicy, :search?)
    get "/api/v1/accounts/search", headers: auth_headers_for(user), params: { q: "ab" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on in-chat search when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :show?)
    get "/api/v1/conversations/#{conversation.id}/search", headers: auth_headers_for(user), params: { q: "ab" }
    expect(response).to have_http_status(:forbidden)
  end
end
