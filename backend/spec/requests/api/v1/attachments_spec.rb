require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Attachment download", type: :request do
  path "/api/v1/attachments/{id}/download" do
    get "Issue a short-lived media URL" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "url issued" do
        schema "$ref" => "#/components/schemas/MediaUrl"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:attachment) do
          row = create(:attachment, message: create(:message, conversation: conversation, sender_account: user.account))
          row.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")
          row
        end
        let(:id) { attachment.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("url")).to be_present
        end
      end

      response "403", "non-member refused (BR-94)" do
        schema "$ref" => "#/components/schemas/Error"
        let(:owner) { create(:user) }
        let(:stranger) { create(:user) }
        let(:conversation) { create_direct_between(owner.account, create(:account)) }
        let(:attachment) do
          row = create(:attachment, message: create(:message, conversation: conversation, sender_account: owner.account))
          row.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")
          row
        end
        let(:id) { attachment.id }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end

RSpec.describe "Attachment thumbnail", type: :request do
  path "/api/v1/attachments/{id}/thumbnail" do
    get "Issue a short-lived thumbnail URL" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "url issued" do
        schema "$ref" => "#/components/schemas/MediaUrl"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:attachment) do
          row = create(:attachment, message: create(:message, conversation: conversation, sender_account: user.account))
          row.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")
          row
        end
        let(:id) { attachment.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("url")).to be_present
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
