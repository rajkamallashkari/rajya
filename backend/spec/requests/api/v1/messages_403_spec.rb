require "rails_helper"

RSpec.describe "Session 3.2 message authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  def member_setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    [ user, conversation, message ]
  end

  it "returns 403 when send is denied" do
    user, conversation, _message = member_setup
    stub_deny(ConversationPolicy, :send?)
    post "/api/v1/messages", headers: auth_headers_for(user),
         params: { conversation_id: conversation.id, body: "Hi" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when a member edits someone else's message" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    message = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Hi").value
    patch "/api/v1/messages/#{message.id}", headers: auth_headers_for(member), params: { body: "Nope" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when a member unsends someone else's message" do
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    message = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Hi").value
    delete "/api/v1/messages/#{message.id}", headers: auth_headers_for(member)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when a channel member posts (SCHEMA §3.1)" do
    member = create(:user)
    conversation = create_talk(kind: "channel", owner: create(:user).account, members: [ member.account ])
    post "/api/v1/messages", headers: auth_headers_for(member),
         params: { conversation_id: conversation.id, body: "Hi" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when forward, react, pin, or save is denied" do
    user, conversation, message = member_setup
    stub_deny(MessagePolicy, :forward?)
    post "/api/v1/messages/#{message.id}/forward", headers: auth_headers_for(user),
         params: { conversation_id: conversation.id }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when react is denied" do
    user, _conversation, message = member_setup
    stub_deny(MessagePolicy, :react?)
    post "/api/v1/messages/#{message.id}/reactions", headers: auth_headers_for(user),
         params: { emoji: "👍" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when pin is denied for a channel member" do
    member = create(:user)
    owner = create(:user)
    conversation = create_talk(kind: "channel", owner: owner.account, members: [ member.account ])
    message = Messages::Send.call(conversation: conversation, sender: owner.account, body: "Hi").value
    post "/api/v1/conversations/#{conversation.id}/pins", headers: auth_headers_for(member),
         params: { message_id: message.id }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when scheduled index is denied" do
    user, _conversation, _message = member_setup
    stub_deny(ScheduledMessagePolicy, :index?)
    get "/api/v1/scheduled_messages", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when scheduled update is denied" do
    user, conversation, _message = member_setup
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    stub_deny(ScheduledMessagePolicy, :update?)
    patch "/api/v1/scheduled_messages/#{row.id}", headers: auth_headers_for(user), params: { body: "X" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when save is denied" do
    user, _conversation, message = member_setup
    stub_deny(MessagePolicy, :save?)
    post "/api/v1/saved_messages", headers: auth_headers_for(user), params: { message_id: message.id }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when unreact is denied" do
    user, _conversation, message = member_setup
    stub_deny(MessagePolicy, :react?)
    delete "/api/v1/messages/#{message.id}/reactions/#{CGI.escape('👍')}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when unpin is denied" do
    user, conversation, message = member_setup
    stub_deny(ConversationPolicy, :pin?)
    delete "/api/v1/conversations/#{conversation.id}/pins/#{message.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when unsave is denied" do
    user, _conversation, message = member_setup
    stub_deny(MessagePolicy, :save?)
    delete "/api/v1/saved_messages/#{message.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when scheduled create is denied" do
    user, conversation, _message = member_setup
    stub_deny(ConversationPolicy, :send?)
    post "/api/v1/scheduled_messages", headers: auth_headers_for(user),
         params: { conversation_id: conversation.id, body: "X", scheduled_at: 1.hour.from_now }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when scheduled destroy is denied" do
    user, conversation, _message = member_setup
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    stub_deny(ScheduledMessagePolicy, :destroy?)
    delete "/api/v1/scheduled_messages/#{row.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when listing messages is denied" do
    user, conversation, _message = member_setup
    stub_deny(ConversationPolicy, :show?)
    get "/api/v1/conversations/#{conversation.id}/messages", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when message info is denied" do
    user, _conversation, message = member_setup
    stub_deny(MessagePolicy, :show?)
    get "/api/v1/messages/#{message.id}/info", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when send_now is denied" do
    user, conversation, _message = member_setup
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
    ).value
    stub_deny(ScheduledMessagePolicy, :send_now?)
    post "/api/v1/scheduled_messages/#{row.id}/send_now", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when poll vote is denied" do
    user, conversation, _message = member_setup
    poll = Messages::Send.call(
      conversation: conversation, sender: user.account, poll: { question: "Q", options: %w[A B] }
    ).value.poll
    stub_deny(PollPolicy, :vote?)
    post "/api/v1/polls/#{poll.id}/vote", headers: auth_headers_for(user),
         params: { option_ids: [ poll.poll_options.first.id ] }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when poll close is denied" do
    user, conversation, _message = member_setup
    poll = Messages::Send.call(
      conversation: conversation, sender: user.account, poll: { question: "Q", options: %w[A B] }
    ).value.poll
    stub_deny(PollPolicy, :close?)
    post "/api/v1/polls/#{poll.id}/close", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when poll results are denied" do
    user, conversation, _message = member_setup
    poll = Messages::Send.call(
      conversation: conversation, sender: user.account, poll: { question: "Q", options: %w[A B] }
    ).value.poll
    stub_deny(PollPolicy, :show?)
    get "/api/v1/polls/#{poll.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end
end
