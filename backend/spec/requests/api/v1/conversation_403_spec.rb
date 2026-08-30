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
        public_send(
          http.fetch(:method),
          "/api/v1/conversations/#{conversation.id}",
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
end
