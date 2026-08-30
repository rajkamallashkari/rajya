require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Conversation members add", type: :request do
  path "/api/v1/conversations/{conversation_id}/members" do
    post "Add members to a group or channel" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { account_ids: { type: :array, items: { type: :integer } } }
      }

      response "200", "added" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:join) { create(:account) }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { account_ids: [ join.id ] } }

        run_test! do |response|
          ids = JSON.parse(response.body).fetch("members").map { |row| row.dig("account", "id") }
          expect(ids).to include(join.id)
        end
      end
    end
  end
end

RSpec.describe "Conversation members remove", type: :request do
  path "/api/v1/conversations/{conversation_id}/members/{account_id}" do
    delete "Remove a member from a group or channel" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :account_id, in: :path, type: :integer

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:member) { create(:user) }
        let(:other) { create(:account) }
        let(:conversation) do
          create_talk(kind: "group", owner: user.account, members: [ member.account, other ])
        end
        let(:conversation_id) { conversation.id }
        let(:account_id) { member.account.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          ids = JSON.parse(response.body).fetch("members").map { |row| row.dig("account", "id") }
          expect(ids).not_to include(member.account.id)
        end
      end
    end
  end
end

RSpec.describe "Conversation members promote", type: :request do
  path "/api/v1/conversations/{conversation_id}/members/{account_id}/promote" do
    patch "Promote a member to admin" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :account_id, in: :path, type: :integer

      response "200", "promoted" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:member) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ member.account ]) }
        let(:conversation_id) { conversation.id }
        let(:account_id) { member.account.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          row = JSON.parse(response.body).fetch("members").find { |item| item.dig("account", "id") == member.account.id }
          expect(row.fetch("role")).to eq("admin")
        end
      end
    end
  end
end

RSpec.describe "Conversation members demote", type: :request do
  path "/api/v1/conversations/{conversation_id}/members/{account_id}/demote" do
    patch "Demote an admin to member" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :account_id, in: :path, type: :integer

      response "200", "demoted" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:admin) { create(:user) }
        let(:conversation) do
          create_talk(kind: "group", owner: user.account, admins: [ admin.account ], members: [ create(:account) ])
        end
        let(:conversation_id) { conversation.id }
        let(:account_id) { admin.account.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          row = JSON.parse(response.body).fetch("members").find { |item| item.dig("account", "id") == admin.account.id }
          expect(row.fetch("role")).to eq("member")
        end
      end
    end
  end
end

RSpec.describe "Conversation members transfer", type: :request do
  path "/api/v1/conversations/{conversation_id}/members/{account_id}/transfer" do
    patch "Transfer group ownership" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :account_id, in: :path, type: :integer

      response "200", "transferred" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:member) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ member.account ]) }
        let(:conversation_id) { conversation.id }
        let(:account_id) { member.account.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("role")).to eq("admin")
          row = body.fetch("members").find { |item| item.dig("account", "id") == member.account.id }
          expect(row.fetch("role")).to eq("owner")
        end
      end
    end
  end
end

RSpec.describe "Conversation leave", type: :request do
  path "/api/v1/conversations/{id}/leave" do
    post "Leave a group or channel" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "left" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: create(:user).account, members: [ user.account ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("ok")).to be(true)
          expect(conversation.conversation_memberships.find_by!(account: user.account).status).to eq("left")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
