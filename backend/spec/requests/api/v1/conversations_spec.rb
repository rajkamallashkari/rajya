require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Conversations index", type: :request do
  path "/api/v1/conversations" do
    get "List the current account's conversations" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :archived, in: :query, type: :boolean, required: false

      response "200", "sidebar" do
        schema "$ref" => "#/components/schemas/ConversationList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
          hidden = create_direct_between(user.account, create(:account))
          Conversations::Archive.call(account: user.account, conversation: hidden)
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("conversations").size).to eq(1)
        end
      end
    end
  end
end

RSpec.describe "Conversations index archived", type: :request do
  path "/api/v1/conversations" do
    get "List the current account's conversations" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :archived, in: :query, type: :boolean, required: false

      response "200", "archived tab" do
        schema "$ref" => "#/components/schemas/ConversationList"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:archived) { true }

        before { Conversations::Archive.call(account: user.account, conversation: conversation) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("conversations").sole.fetch("id")).to eq(conversation.id)
        end
      end
    end
  end
end

RSpec.describe "Conversations create direct", type: :request do
  path "/api/v1/conversations" do
    post "Create a conversation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          account_id: { type: :integer },
          account_ids: { type: :array, items: { type: :integer } },
          title: { type: :string },
          description: { type: :string }
        }
      }

      response "201", "direct created" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:peer) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { kind: "direct", account_id: peer.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("kind")).to eq("direct")
        end
      end
    end
  end
end

RSpec.describe "Conversations create group", type: :request do
  path "/api/v1/conversations" do
    post "Create a conversation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          account_ids: { type: :array, items: { type: :integer } },
          title: { type: :string }
        }
      }

      response "201", "group created" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:other) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { kind: "group", account_ids: [ other.id ], title: "Team" } }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("kind")).to eq("group")
          expect(body.fetch("title")).to eq("Team")
        end
      end
    end
  end
end

RSpec.describe "Conversations create blocked", type: :request do
  path "/api/v1/conversations" do
    post "Create a conversation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          account_id: { type: :integer }
        }
      }

      response "404", "blocked new DM (NR-1)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:peer) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { kind: "direct", account_id: peer.id } }

        before { create(:block, blocker_account: user.account, blocked_account: peer) }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Conversations create blocked reverse", type: :request do
  path "/api/v1/conversations" do
    post "Create a conversation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          account_id: { type: :integer }
        }
      }

      response "404", "blocked new DM reverse (NR-1)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { kind: "direct", account_id: peer.account.id } }

        before { create(:block, blocker_account: peer.account, blocked_account: user.account) }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Conversations show", type: :request do
  path "/api/v1/conversations/{id}" do
    get "Show a conversation" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("id")).to eq(conversation.id)
        end
      end
    end
  end
end

RSpec.describe "Conversations show hidden", type: :request do
  path "/api/v1/conversations/{id}" do
    get "Show a conversation" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "404", "not a member" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end

RSpec.describe "Conversations update", type: :request do
  path "/api/v1/conversations/{id}" do
    patch "Update conversation info" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          title: { type: :string },
          description: { type: :string },
          member_permissions: { type: :object, additionalProperties: { type: :string } },
          slow_mode_seconds: { type: :integer },
          restrict_forwarding: { type: :boolean }
        }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { title: "Renamed", description: "New bio" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("title" => "Renamed", "description" => "New bio")
        end
      end
    end
  end
end

RSpec.describe "Conversations update title only", type: :request do
  path "/api/v1/conversations/{id}" do
    patch "Update conversation info" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { title: { type: :string } }
      }

      response "200", "title only" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { title: "Title only" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("title")).to eq("Title only")
        end
      end
    end
  end
end

RSpec.describe "Conversations update description only", type: :request do
  path "/api/v1/conversations/{id}" do
    patch "Update conversation info" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { description: { type: :string } }
      }

      response "200", "description only" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { description: "Bio only" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("description")).to eq("Bio only")
        end
      end
    end
  end
end

RSpec.describe "Conversations update permissions", type: :request do
  path "/api/v1/conversations/{id}" do
    patch "Update conversation info" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          title: { type: :string },
          description: { type: :string },
          member_permissions: { type: :object, additionalProperties: { type: :string } },
          slow_mode_seconds: { type: :integer },
          restrict_forwarding: { type: :boolean }
        }
      }

      response "200", "permissions updated" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          {
            member_permissions: { send_messages: "admin" },
            slow_mode_seconds: 10,
            restrict_forwarding: true
          }
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("member_permissions")).to eq("send_messages" => "admin")
          expect(body.fetch("slow_mode_seconds")).to eq(10)
          expect(body.fetch("restrict_forwarding")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Conversations pin", type: :request do
  path "/api/v1/conversations/{id}/pin" do
    post "Pin a conversation for the current account" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "pinned" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("pinned_at")).to be_present
        end
      end
    end

    delete "Unpin a conversation for the current account" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "unpinned" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Conversations::Pin.call(account: user.account, conversation: conversation) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("pinned_at")).to be_nil
        end
      end
    end
  end
end

RSpec.describe "Conversations unread", type: :request do
  path "/api/v1/conversations/{id}/unread" do
    post "Mark a conversation unread" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "marked unread" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("manually_unread_at")).to be_present
        end
      end
    end

    delete "Clear a manual unread mark" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "cleared" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Conversations::MarkUnread.call(account: user.account, conversation: conversation) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("manually_unread_at")).to be_nil
        end
      end
    end
  end
end

RSpec.describe "Conversations archive", type: :request do
  path "/api/v1/conversations/{id}/archive" do
    post "Archive a conversation for the current account" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "archived" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:peer) { create(:account) }
        let(:conversation) { create_direct_between(user.account, peer) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("archived_at")).to be_present
          expect(conversation.conversation_memberships.find_by!(account: peer).archived_at).to be_nil
        end
      end
    end

    delete "Unarchive a conversation for the current account" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "unarchived" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Conversations::Archive.call(account: user.account, conversation: conversation) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("archived_at")).to be_nil
        end
      end
    end
  end
end

RSpec.describe "Conversations mute", type: :request do
  path "/api/v1/conversations/{id}/mute" do
    post "Mute a conversation for the current account" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { duration: { type: :integer } }
      }

      response "200", "muted" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { duration: Array(Settings.fetch(:mute_durations)).first } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("muted_until")).to be_present
        end
      end
    end

    delete "Unmute a conversation for the current account" do
      tags "Conversations"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "unmuted" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          Conversations::Mute.call(
            account: user.account, conversation: conversation, duration: Array(Settings.fetch(:mute_durations)).first
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("muted_until")).to be_nil
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName

RSpec.describe "Conversation receipts", type: :request do
  # rubocop:disable RSpec/VariableName, RSpec/EmptyExampleGroup, RSpec/MultipleMemoizedHelpers
  path "/api/v1/conversations/{id}/receipts" do
    post "Advance delivery or view watermarks" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[kind position],
        properties: {
          kind: { type: :string, enum: %w[delivered viewed] },
          position: { type: :integer }
        }
      }

      response "200", "watermark advanced" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:peer) { create(:user) }
        let(:conversation) { create_direct_between(user.account, peer.account) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: peer.account, body: "Hi").value }
        let(:id) { conversation.id }
        let(:payload) { { kind: "viewed", position: message.position } }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("unread_count")).to eq(0)
          expect(conversation.conversation_memberships.find_by!(account: user.account).last_read_position)
            .to eq(message.position)
        end
      end

      response "422", "invalid kind" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:payload) { { kind: "nope", position: 1 } }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("validation_failed")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
