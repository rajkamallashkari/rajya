require "rails_helper"

RSpec.describe "Session 9.3 authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on bot index when denied (F-1)" do
    user = create(:user)
    stub_deny(BotPolicy, :index?)
    get "/api/v1/bots", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on bot show when denied (F-1)" do
    user = create(:user)
    stub_deny(BotPolicy, :show?)
    get "/api/v1/bots/#{create(:bot).id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on bot destroy when denied (F-1)" do
    user = create(:user)
    bot = create(:bot, owner_account: user.account)
    stub_deny(BotPolicy, :destroy?)
    delete "/api/v1/bots/#{bot.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on bot request create when denied (F-1)" do
    user = create(:user)
    stub_deny(BotRequestPolicy, :create?)
    post "/api/v1/bot_requests", headers: auth_headers_for(user), as: :json, params: { payload: {} }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on bot request index when denied (F-1)" do
    user = create(:user)
    stub_deny(BotRequestPolicy, :index?)
    get "/api/v1/bot_requests", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on rewrite when denied (F-1)" do
    user = create(:user)
    stub_deny(AiPolicy, :rewrite?)
    post "/api/v1/ai/rewrite", headers: auth_headers_for(user), as: :json, params: { text: "hi", tones: [ "casual" ] }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on translate_text when denied (F-1)" do
    user = create(:user)
    stub_deny(AiPolicy, :translate_text?)
    post "/api/v1/ai/translate_text", headers: auth_headers_for(user), as: :json,
         params: { text: "hi", target_language: "en" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on style profile when denied (F-1)" do
    user = create(:user)
    stub_deny(AiPolicy, :style_profile?)
    get "/api/v1/style_profile", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on message translate when denied (F-1)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    stub_deny(MessagePolicy, :translate?)
    post "/api/v1/messages/#{message.id}/translate", headers: auth_headers_for(user), as: :json,
         params: { target_language: "en" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on suggest replies when denied (F-1)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :suggest_replies?)
    post "/api/v1/conversations/#{conversation.id}/suggest_replies", headers: auth_headers_for(user), as: :json,
         params: { message_id: 1 }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on summarize when denied (F-1)" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :summarize?)
    post "/api/v1/conversations/#{conversation.id}/summarize", headers: auth_headers_for(user), as: :json,
         params: { mode: "recent" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on bot request destroy when denied (F-1)" do
    user = create(:user)
    request = create(:bot_request, requester_account: user.account)
    stub_deny(BotRequestPolicy, :destroy?)
    delete "/api/v1/bot_requests/#{request.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on style profile update when denied (F-1)" do
    user = create(:user)
    stub_deny(AiPolicy, :style_profile?)
    patch "/api/v1/style_profile", headers: auth_headers_for(user), as: :json, params: { enabled: true }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on style profile build when denied (F-1)" do
    user = create(:user)
    stub_deny(AiPolicy, :style_profile?)
    post "/api/v1/style_profile", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin bot-request approve when denied (F-1)" do
    admin = create(:user, :admin)
    request = create(:bot_request, requester_account: create(:user).account)
    stub_deny(Admin::BotRequestPolicy, :approve?)
    post "/api/v1/admin/bot_requests/#{request.id}/approve", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin bot-request decline when denied (F-1)" do
    admin = create(:user, :admin)
    request = create(:bot_request, requester_account: create(:user).account)
    stub_deny(Admin::BotRequestPolicy, :decline?)
    post "/api/v1/admin/bot_requests/#{request.id}/decline", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin bot-request index when denied (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::BotRequestPolicy, :index?)
    get "/api/v1/admin/bot_requests", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end
end
