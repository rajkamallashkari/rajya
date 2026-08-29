require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Contact nicknames index", type: :request do
  path "/api/v1/contact_nicknames" do
    get "List the current account's contact nicknames" do
      tags "Contact nicknames"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "list" do
        schema "$ref" => "#/components/schemas/ContactNicknameList"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:contact_nickname, owner_account: user.account, target_account: target, nickname: "Ada") }

        run_test! do |response|
          row = JSON.parse(response.body).fetch("nicknames").first
          expect(row.fetch("nickname")).to eq("Ada")
          expect(row.dig("account", "id")).to eq(target.id)
        end
      end
    end
  end
end

RSpec.describe "Contact nicknames upsert", type: :request do
  path "/api/v1/contact_nicknames/{account_id}" do
    put "Set a private nickname for a contact" do
      tags "Contact nicknames"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :account_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { nickname: { type: :string } }
      }

      response "200", "saved" do
        schema "$ref" => "#/components/schemas/ContactNickname"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:account_id) { target.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { nickname: "Ada" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("nickname")).to eq("Ada")
        end
      end
    end

    delete "Remove a private nickname" do
      tags "Contact nicknames"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :account_id, in: :path, type: :integer

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:account_id) { target.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:contact_nickname, owner_account: user.account, target_account: target) }

        run_test! do
          expect(ContactNickname.where(owner_account: user.account, target_account: target)).not_to exist
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
