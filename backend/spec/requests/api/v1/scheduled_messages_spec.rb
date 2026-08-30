require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Scheduled messages index", type: :request do
  path "/api/v1/scheduled_messages" do
    get "List pending scheduled messages" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/ScheduledMessageList"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          ScheduledMessages::Create.call(
            conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("scheduled_messages").size).to eq(1)
        end
      end
    end

    post "Schedule a message" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          conversation_id: { type: :integer },
          body: { type: :string },
          scheduled_at: { type: :string, format: :"date-time" },
          client_nonce: { type: :string, format: :uuid }
        }
      }

      response "201", "scheduled" do
        schema "$ref" => "#/components/schemas/ScheduledMessage"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { conversation_id: conversation.id, body: "Later", scheduled_at: 1.hour.from_now.iso8601 } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("body")).to eq("Later")
        end
      end
    end
  end
end

RSpec.describe "Scheduled messages update", type: :request do
  path "/api/v1/scheduled_messages/{id}" do
    patch "Update a scheduled message" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { body: { type: :string }, scheduled_at: { type: :string, format: :"date-time" } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/ScheduledMessage"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:row) do
          ScheduledMessages::Create.call(
            conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
          ).value
        end
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { body: "New" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("body")).to eq("New")
        end
      end
    end
  end
end

RSpec.describe "Scheduled messages destroy", type: :request do
  path "/api/v1/scheduled_messages/{id}" do
    delete "Cancel a scheduled message" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "cancelled" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:row) do
          ScheduledMessages::Create.call(
            conversation: conversation, sender: user.account, body: "Later", scheduled_at: 1.hour.from_now
          ).value
        end
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(ScheduledMessage.where(id: row.id)).not_to exist
        end
      end
    end
  end
end

RSpec.describe "Scheduled messages send now", type: :request do
  path "/api/v1/scheduled_messages/{id}/send_now" do
    post "Send a scheduled message immediately" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "201", "sent" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:row) do
          ScheduledMessages::Create.call(
            conversation: conversation, sender: user.account, body: "Now", scheduled_at: 1.hour.from_now
          ).value
        end
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("body")).to eq("Now")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
