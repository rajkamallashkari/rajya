require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Reports create", type: :request do
  path "/api/v1/reports" do
    post "Submit a report" do
      tags "Reports"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[subject_type subject_id reason],
        properties: {
          subject_type: { type: :string, enum: %w[message account conversation bot] },
          subject_id: { type: :integer },
          reason: { type: :string },
          details: { type: :string, nullable: true }
        }
      }

      response "201", "filed" do
        schema "$ref" => "#/components/schemas/Report"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { subject_type: "account", subject_id: target.id, reason: "spam" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("subject_id" => target.id, "reason" => "spam")
        end
      end

      response "409", "duplicate open report" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:target) { create(:account) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { subject_type: "account", subject_id: target.id, reason: "spam" } }

        before { create(:report, reporter_account: user.account, subject_type: "account", subject_id: target.id) }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("conflict")
        end
      end
    end
  end
end

RSpec.describe "Reports reasons", type: :request do
  path "/api/v1/reports/reasons" do
    get "List selectable report reasons" do
      tags "Reports"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/ReportReasonList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          ids = JSON.parse(response.body).fetch("reasons").map { |row| row.fetch("id") }
          expect(ids).to eq(Array(Settings.fetch(:report_reasons)).map(&:to_s))
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName
