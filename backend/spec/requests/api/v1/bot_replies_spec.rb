require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Message regenerate", type: :request do
  path "/api/v1/messages/{id}/regenerate" do
    post "Regenerate a bot reply" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "tombstoned" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:bot) { create(:bot) }
        let(:conversation) { create_direct_between(user.account, bot.account) }
        let(:trigger) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:reply) do
          Bots::PersistReply.call(
            conversation: conversation, bot: bot, body: "Old", triggered_by: trigger,
            generation_id: "g", nonce: SecureRandom.uuid
          ).value
        end
        let(:id) { reply.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("deleted")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Conversation generation cancel", type: :request do
  path "/api/v1/conversations/{id}/generations/cancel" do
    post "Cancel an in-flight bot generation" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { generation_id: { type: :string } },
        required: %w[generation_id]
      }

      response "200", "cancel flagged" do
        schema "$ref" => "#/components/schemas/Generation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { generation_id: "1:2:3" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("generation_id")).to eq("1:2:3")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
