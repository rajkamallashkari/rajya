require "rails_helper"

RSpec.describe "Session 3.1 conversation authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on conversation index when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(ConversationPolicy, :index?)
    get "/api/v1/conversations", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on conversation show when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    stub_deny(ConversationPolicy, :show?)
    get "/api/v1/conversations/#{conversation.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on conversation create when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(ConversationPolicy, :create?)
    post "/api/v1/conversations", headers: auth_headers_for(user), params: { kind: "direct" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on conversation update when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    stub_deny(ConversationPolicy, :update?)
    patch "/api/v1/conversations/#{conversation.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  def actor_setup(actor)
    owner = create(:user)
    admin = create(:user)
    member = create(:user)
    peer = create(:user)

    case actor
    when :direct
      [ owner, create_direct_between(owner.account, peer.account) ]
    when :group_member
      [ member, create_talk(kind: "group", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :group_admin
      [ admin, create_talk(kind: "group", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :group_owner
      [ owner, create_talk(kind: "group", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :channel_member
      [ member, create_talk(kind: "channel", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :channel_admin
      [ admin, create_talk(kind: "channel", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :channel_owner
      [ owner, create_talk(kind: "channel", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    end
  end

  ConversationPermissionMatrix::HTTP_403.each do |query, http|
    ConversationPermissionMatrix::ACTORS.each do |actor|
      next if ConversationPermissionMatrix::ALLOWED.fetch(query).fetch(actor)

      it "returns 403 when #{actor} is denied #{query} (SCHEMA §3.1)" do
        user, conversation = actor_setup(actor)
        suffix = http[:suffix]
        path = "/api/v1/conversations/#{conversation.id}"
        path += suffix.respond_to?(:call) ? suffix.call(conversation) : suffix.to_s
        public_send(
          http.fetch(:method),
          path,
          headers: auth_headers_for(user),
          params: http[:body],
          as: :json
        )
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  it "returns 403 on conversation pin when organize is denied" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :organize?)
    post "/api/v1/conversations/#{conversation.id}/pin", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on conversation unpin when organize is denied" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :organize?)
    delete "/api/v1/conversations/#{conversation.id}/pin", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on mark unread when organize is denied" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :organize?)
    post "/api/v1/conversations/#{conversation.id}/unread", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on clear unread when organize is denied" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :organize?)
    delete "/api/v1/conversations/#{conversation.id}/unread", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on receipt advance when show is denied" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    stub_deny(ConversationPolicy, :show?)
    post "/api/v1/conversations/#{conversation.id}/receipts", headers: auth_headers_for(user),
         params: { kind: "viewed", position: 1 }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on leave when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    stub_deny(ConversationPolicy, :leave?)
    post "/api/v1/conversations/#{conversation.id}/leave", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on add members when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    stub_deny(ConversationPolicy, :add_members?)
    post "/api/v1/conversations/#{conversation.id}/members", headers: auth_headers_for(user),
         params: { account_ids: [ create(:account).id ] }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on remove member when the policy denies (F-1)" do
    user = create(:user)
    peer = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ peer.account ])
    stub_deny(ConversationPolicy, :remove_member?)
    delete "/api/v1/conversations/#{conversation.id}/members/#{peer.account.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on promote when the policy denies (F-1)" do
    user = create(:user)
    peer = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ peer.account ])
    stub_deny(ConversationPolicy, :promote_admin?)
    patch "/api/v1/conversations/#{conversation.id}/members/#{peer.account.id}/promote",
          headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on demote when the policy denies (F-1)" do
    user = create(:user)
    peer = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ peer.account ])
    stub_deny(ConversationPolicy, :demote_admin?)
    patch "/api/v1/conversations/#{conversation.id}/members/#{peer.account.id}/demote",
          headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on transfer when the policy denies (F-1)" do
    user = create(:user)
    peer = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ peer.account ])
    stub_deny(ConversationPolicy, :transfer_ownership?)
    patch "/api/v1/conversations/#{conversation.id}/members/#{peer.account.id}/transfer",
          headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on invite create when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    stub_deny(ConversationPolicy, :create_invite?)
    post "/api/v1/conversations/#{conversation.id}/invites", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on invite destroy when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    invite = create(:group_invite, conversation: conversation, created_by_account: user.account)
    stub_deny(ConversationPolicy, :create_invite?)
    delete "/api/v1/conversations/#{conversation.id}/invites/#{invite.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on join-request reject when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    request_row = create(:join_request, conversation: conversation, account: create(:account))
    stub_deny(ConversationPolicy, :approve_join?)
    post "/api/v1/conversations/#{conversation.id}/join_requests/#{request_row.id}/reject",
         headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on join-request index when the policy denies (F-1)" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    stub_deny(ConversationPolicy, :approve_join?)
    get "/api/v1/conversations/#{conversation.id}/join_requests", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on invite join when the policy denies (F-1)" do
    user = create(:user)
    owner = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    invite = create(:group_invite, conversation: conversation, created_by_account: owner.account)
    stub_deny(GroupInvitePolicy, :join?)
    post "/api/v1/invites/#{invite.token}/join", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end
end
