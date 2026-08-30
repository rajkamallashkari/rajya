require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Polls show", type: :request do
  path "/api/v1/polls/{id}" do
    get "Poll results" do
      tags "Polls"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "results" do
        schema "$ref" => "#/components/schemas/Poll"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) do
          Messages::Send.call(
            conversation: conversation, sender: user.account,
            poll: { question: "Lunch?", options: %w[Yes No] }
          ).value
        end
        let(:id) { message.poll.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("question")).to eq("Lunch?")
        end
      end
    end
  end
end

RSpec.describe "Polls vote", type: :request do
  path "/api/v1/polls/{id}/vote" do
    post "Vote in a poll" do
      tags "Polls"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { option_ids: { type: :array, items: { type: :integer } } }
      }

      response "200", "voted" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) do
          Messages::Send.call(
            conversation: conversation, sender: user.account,
            poll: { question: "Lunch?", options: %w[Yes No] }
          ).value
        end
        let(:id) { message.poll.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { option_ids: [ message.poll.poll_options.first.id ] } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("poll", "voter_count")).to eq(1)
        end
      end
    end
  end
end

RSpec.describe "Polls close", type: :request do
  path "/api/v1/polls/{id}/close" do
    post "Close a poll" do
      tags "Polls"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "closed" do
        schema "$ref" => "#/components/schemas/Message"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) do
          Messages::Send.call(
            conversation: conversation, sender: user.account,
            poll: { question: "Lunch?", options: %w[Yes No] }
          ).value
        end
        let(:id) { message.poll.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("poll", "closed")).to be(true)
        end
      end
    end
  end
end
# rubocop:enable RSpec/VariableName
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
