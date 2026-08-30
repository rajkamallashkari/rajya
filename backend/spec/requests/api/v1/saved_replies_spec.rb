require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Saved replies index", type: :request do
  path "/api/v1/saved_replies" do
    get "List saved replies" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/SavedReplyList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { SavedReplies::Create.call(account: user.account, shortcut: "/omw", body: "On my way") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("saved_replies").sole.fetch("shortcut")).to eq("/omw")
        end
      end
    end

    post "Create a saved reply" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          shortcut: { type: :string },
          body: { type: :string },
          position: { type: :integer }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/SavedReply"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { shortcut: "/omw", body: "On my way" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("shortcut" => "/omw", "body" => "On my way")
        end
      end
    end
  end
end

RSpec.describe "Saved replies update", type: :request do
  path "/api/v1/saved_replies/{id}" do
    patch "Update a saved reply" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { shortcut: { type: :string }, body: { type: :string }, position: { type: :integer } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/SavedReply"
        let(:user) { create(:user) }
        let(:row) { SavedReplies::Create.call(account: user.account, shortcut: "/omw", body: "On my way").value }
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { body: "Almost there" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("body")).to eq("Almost there")
        end
      end
    end
  end
end

RSpec.describe "Saved replies destroy", type: :request do
  path "/api/v1/saved_replies/{id}" do
    delete "Delete a saved reply" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "deleted" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:row) { SavedReplies::Create.call(account: user.account, shortcut: "/omw", body: "On my way").value }
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(SavedReply.where(id: row.id)).not_to exist
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
