require "rails_helper"

RSpec.describe "Blocking enforcement", type: :request do
  def blocked_group
    owner = create(:user)
    member = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ member.account ])
    create(:block, blocker_account: owner.account, blocked_account: member.account)
    [ owner, member, conversation ]
  end

  def listed_ids
    JSON.parse(response.body).fetch("conversations").map { |row| row.fetch("id") }
  end

  it "still lists the shared group for both accounts after a block (NR-1)" do
    owner, member, conversation = blocked_group
    get "/api/v1/conversations", headers: auth_headers_for(owner)
    expect(listed_ids).to include(conversation.id)
    get "/api/v1/conversations", headers: auth_headers_for(member)
    expect(listed_ids).to include(conversation.id)
  end

  it "still allows sending in a shared group after a block (NR-1)" do
    _owner, member, conversation = blocked_group
    post "/api/v1/messages", headers: auth_headers_for(member),
         params: { conversation_id: conversation.id, body: "Still here" }, as: :json
    expect(response).to have_http_status(:created)
  end

  it "still allows adding members to a shared group after a block (NR-1)" do
    owner, _member, conversation = blocked_group
    extra = create(:account)
    post "/api/v1/conversations/#{conversation.id}/members", headers: auth_headers_for(owner),
         params: { account_ids: [ extra.id ] }, as: :json
    expect(response).to have_http_status(:ok)
  end
end
