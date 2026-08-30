require "rails_helper"

RSpec.describe "Session 6.4 group permission overrides", type: :request do
  include ActiveSupport::Testing::TimeHelpers
  it "returns 403 when send_messages is narrowed to admin (NR-34)" do
    member = create(:user)
    conversation = create_talk(kind: "group", owner: create(:user).account, members: [ member.account ])
    conversation.update!(member_permissions: { "send_messages" => "admin" })

    post "/api/v1/messages", headers: auth_headers_for(member),
         params: { conversation_id: conversation.id, body: "Hi" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when an admin patches after edit_info is owner-only" do
    admin = create(:user)
    conversation = create_talk(
      kind: "group", owner: create(:user).account, admins: [ admin.account ], members: [ create(:account) ]
    )
    conversation.update!(member_permissions: { "edit_info" => "owner" })

    patch "/api/v1/conversations/#{conversation.id}", headers: auth_headers_for(admin),
          params: { title: "Nope" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when forwarding from a restricted conversation (NR-37)" do
    user = create(:user)
    source = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    source.update!(restrict_forwarding: true)
    target = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: source, sender: user.account, body: "Hi").value

    post "/api/v1/messages/#{message.id}/forward", headers: auth_headers_for(user),
         params: { conversation_id: target.id }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 429 with retry_after when slow mode is active (NR-36)" do
    freeze_time do
      member = create(:user)
      conversation = create_talk(kind: "group", owner: create(:user).account, members: [ member.account ])
      conversation.update!(slow_mode_seconds: 10)
      post "/api/v1/messages", headers: auth_headers_for(member),
           params: { conversation_id: conversation.id, body: "First" }, as: :json
      post "/api/v1/messages", headers: auth_headers_for(member),
           params: { conversation_id: conversation.id, body: "Second" }, as: :json

      expect(response).to have_http_status(:too_many_requests)
      expect(response.parsed_body.dig("error", "details", "retry_after")).to eq(10)
    end
  end
end
