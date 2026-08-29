require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Device sessions index", type: :request do
  path "/api/v1/sessions" do
    get "List active devices for the current user" do
      tags "Sessions"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "list" do
        schema "$ref" => "#/components/schemas/DeviceSessionList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          body = JSON.parse(response.body).fetch("sessions")
          expect(body.length).to eq(1)
          expect(body.first.fetch("current")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Device sessions revoke others", type: :request do
  path "/api/v1/sessions/others" do
    delete "Sign out every other device" do
      tags "Sessions"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "revoked" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:other) { create(:session, user: user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { other }

        run_test! do
          expect(other.reload).to be_revoked
          expect(::Session.active.where(user: user).count).to eq(1)
        end
      end
    end
  end
end

RSpec.describe "Device sessions destroy", type: :request do
  path "/api/v1/sessions/{id}" do
    delete "Sign out one device" do
      tags "Sessions"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "revoked" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:other) { create(:session, user: user) }
        let(:id) { other.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { other }

        run_test! do
          expect(other.reload).to be_revoked
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
