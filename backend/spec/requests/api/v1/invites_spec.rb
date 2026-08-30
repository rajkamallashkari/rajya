require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Conversation invites index and create", type: :request do
  path "/api/v1/conversations/{conversation_id}/invites" do
    get "List group invites" do
      tags "Invites"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/GroupInviteList"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:group_invite, conversation: conversation, created_by_account: user.account) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("invites").size).to eq(1)
        end
      end
    end

    post "Create a group invite" do
      tags "Invites"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          requires_approval: { type: :boolean },
          max_uses: { type: :integer, nullable: true },
          expires_in_seconds: { type: :integer, nullable: true }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/GroupInvite"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { requires_approval: true, max_uses: 5 } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("requires_approval" => true, "max_uses" => 5)
        end
      end
    end
  end
end

RSpec.describe "Conversation invites destroy", type: :request do
  path "/api/v1/conversations/{conversation_id}/invites/{id}" do
    delete "Revoke a group invite" do
      tags "Invites"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :id, in: :path, type: :integer

      response "200", "revoked" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:invite) { create(:group_invite, conversation: conversation, created_by_account: user.account) }
        let(:conversation_id) { conversation.id }
        let(:id) { invite.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |_response|
          expect(GroupInvite.find_by(id: invite.id)).to be_nil
        end
      end
    end
  end
end

RSpec.describe "Public invite preview", type: :request do
  path "/api/v1/invites/{token}" do
    get "Public invite preview" do
      tags "Invites"
      produces "application/json"
      parameter name: :token, in: :path, type: :string

      response "200", "preview without auth (BR-59)" do
        schema "$ref" => "#/components/schemas/InvitePreview"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:invite) { create(:group_invite, conversation: conversation, created_by_account: user.account) }
        let(:token) { invite.token }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body).to include("title" => conversation.title, "member_count" => 2)
          expect(body.fetch("conversation_id")).to be_nil
          expect(body.keys).not_to include("messages", "body", "last_message")
        end
      end
    end
  end
end

RSpec.describe "Invite join", type: :request do
  path "/api/v1/invites/{token}/join" do
    post "Join via invite token" do
      tags "Invites"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :token, in: :path, type: :string

      response "200", "joined" do
        schema "$ref" => "#/components/schemas/InviteJoin"
        let(:owner) { create(:user) }
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: owner.account, members: [ create(:account) ]) }
        let(:invite) { create(:group_invite, conversation: conversation, created_by_account: owner.account) }
        let(:token) { invite.token }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("status")).to eq("joined")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName

RSpec.describe "Authenticated invite preview", type: :request do
  it "loads optional identity so members see membership flags" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    invite = create(:group_invite, conversation: conversation, created_by_account: user.account)

    get "/api/v1/invites/#{invite.token}", headers: auth_headers_for(user)

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.fetch("already_member")).to be(true)
    expect(body.fetch("conversation_id")).to eq(conversation.id)
  end
end
