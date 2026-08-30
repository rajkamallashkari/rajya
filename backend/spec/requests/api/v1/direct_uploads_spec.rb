require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Direct uploads", type: :request do
  path "/api/v1/direct_uploads" do
    post "Presign a direct upload" do
      tags "Media"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[filename byte_size checksum content_type],
        properties: {
          filename: { type: :string },
          byte_size: { type: :integer },
          checksum: { type: :string },
          content_type: { type: :string }
        }
      }

      before { create(:storage_bucket, service_name: "test") }

      response "200", "presigned" do
        schema "$ref" => "#/components/schemas/DirectUpload"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          {
            filename: "pic.png",
            byte_size: 4,
            checksum: Digest::MD5.base64digest("data"),
            content_type: "image/png"
          }
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("skip_upload")).to be(false)
          expect(body.fetch("blob_signed_id")).to be_present
        end
      end

      response "422", "file too large" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          {
            filename: "pic.png",
            byte_size: Settings.fetch(:file_caps).fetch("image") + 1,
            checksum: Digest::MD5.base64digest("data"),
            content_type: "image/png"
          }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("validation_failed")
        end
      end

      response "200", "checksum reuse" do
        schema "$ref" => "#/components/schemas/DirectUpload"
        let(:user) { create(:user) }
        let(:blob) do
          ActiveStorage::Blob.create_and_upload!(
            io: StringIO.new("data"), filename: "pic.png", content_type: "image/png"
          )
        end
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          {
            filename: "pic.png",
            byte_size: blob.byte_size,
            checksum: blob.checksum,
            content_type: "image/png"
          }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("skip_upload")).to be(true)
        end
      end

      response "507", "quota exceeded" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) do
          account_user = create(:user)
          create(:storage_quota, account: account_user.account, quota_bytes: 3, used_bytes: 0)
          account_user
        end
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          {
            filename: "pic.png",
            byte_size: 4,
            checksum: Digest::MD5.base64digest("data"),
            content_type: "image/png"
          }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("quota_exceeded")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
