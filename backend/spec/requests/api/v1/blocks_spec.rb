require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Blocks index", type: :request do
  path "/api/v1/blocks" do
    get "List accounts the current account has blocked" do
      tags "Blocks"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "list" do
        schema "$ref" => "#/components/schemas/BlockList"
        let(:user) { create(:user) }
        let(:blocked) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:block, blocker_account: user.account, blocked_account: blocked) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("blocks").first.dig("account", "id")).to eq(blocked.id)
        end
      end
    end

    post "Block an account" do
      tags "Blocks"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { account_id: { type: :integer } }
      }

      response "201", "blocked" do
        schema "$ref" => "#/components/schemas/Block"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { account_id: target.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("account", "id")).to eq(target.id)
        end
      end
    end
  end
end

RSpec.describe "Blocks destroy", type: :request do
  path "/api/v1/blocks/{id}" do
    delete "Unblock an account" do
      tags "Blocks"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "unblocked" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:id) { target.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:block, blocker_account: user.account, blocked_account: target) }

        run_test! do
          expect(Block.where(blocker_account: user.account, blocked_account: target)).not_to exist
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
