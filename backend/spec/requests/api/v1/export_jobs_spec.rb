require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Export jobs index", type: :request do
  path "/api/v1/export_jobs" do
    get "List export jobs" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/ExportJobList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:export_job, account: user.account, format: "txt") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("export_jobs").sole.fetch("format")).to eq("txt")
        end
      end
    end

    post "Create an export job" do
      tags "Media"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          conversation_id: { type: :integer, nullable: true },
          format: { type: :string, enum: %w[json txt html] },
          include_media: { type: :boolean }
        }
      }

      response "201", "queued" do
        schema "$ref" => "#/components/schemas/ExportJob"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { conversation_id: conversation.id, format: "json" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("format" => "json", "status" => "pending")
        end
      end

      response "201", "account-wide queued" do
        schema "$ref" => "#/components/schemas/ExportJob"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { format: "txt" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("format" => "txt", "status" => "pending", "conversation_id" => nil)
        end
      end

      response "403", "non-member refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:owner) { create(:user) }
        let(:stranger) { create(:user) }
        let(:conversation) { create_direct_between(owner.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }
        let(:payload) { { conversation_id: conversation.id, format: "json" } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end

RSpec.describe "Export jobs show", type: :request do
  path "/api/v1/export_jobs/{id}" do
    get "Show an export job" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/ExportJob"
        let(:user) { create(:user) }
        let(:job) { create(:export_job, account: user.account) }
        let(:id) { job.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("id")).to eq(job.id)
        end
      end

      response "403", "stranger refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:owner) { create(:user) }
        let(:stranger) { create(:user) }
        let(:job) { create(:export_job, account: owner.account) }
        let(:id) { job.id }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end

RSpec.describe "Export jobs download", type: :request do
  path "/api/v1/export_jobs/{id}/download" do
    get "Issue a short-lived export URL" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "url issued" do
        schema "$ref" => "#/components/schemas/MediaUrl"
        let(:user) { create(:user) }
        let(:job) do
          row = create(:export_job, account: user.account, status: "ready")
          blob = ActiveStorage::Blob.create_and_upload!(
            io: StringIO.new("export"), filename: "e.json", content_type: "application/json"
          )
          row.update!(blob: blob)
          row
        end
        let(:id) { job.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("url")).to be_present
        end
      end

      response "403", "stranger refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:owner) { create(:user) }
        let(:stranger) { create(:user) }
        let(:job) { create(:export_job, account: owner.account, status: "ready") }
        let(:id) { job.id }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
