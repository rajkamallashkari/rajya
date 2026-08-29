require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Username availability", type: :request do
  path "/api/v1/accounts/username" do
    get "Check whether a username is available" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :username, in: :query, type: :string

      response "200", "availability" do
        schema "$ref" => "#/components/schemas/UsernameAvailability"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:username) { "brand_new" }

        run_test! do |response|
          expect(JSON.parse(response.body)).to eq("available" => true)
        end
      end
    end
  end
end

RSpec.describe "Account profile", type: :request do
  path "/api/v1/accounts/{id}" do
    get "Show a public profile" do
      tags "Accounts"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "visible" do
        schema "$ref" => "#/components/schemas/Account"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("id")).to eq(target.id)
        end
      end

      response "404", "blocked (NR-1 invisibility)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:id) { target.id }

        before { create(:block, blocker_account: user.account, blocked_account: target) }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("not_found")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
