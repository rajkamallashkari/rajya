require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Conversation gallery", type: :request do
  path "/api/v1/conversations/{id}/media" do
    get "List shared media, files, or links" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :kind, in: :query, type: :string, required: false
      parameter name: :page, in: :query, type: :integer, required: false

      response "200", "gallery page" do
        schema "$ref" => "#/components/schemas/GalleryPage"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:kind) { "images" }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          message = create(:message, conversation: conversation, sender_account: user.account)
          row = create(:attachment, message: message, kind: "image")
          row.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")
        end

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("items").sole.fetch("item_kind")).to eq("attachment")
          expect(body.dig("meta", "total")).to eq(1)
        end
      end

      response "403", "non-member refused" do
        schema "$ref" => "#/components/schemas/Error"
        let(:owner) { create(:user) }
        let(:stranger) { create(:user) }
        let(:conversation) { create_direct_between(owner.account, create(:account)) }
        let(:id) { conversation.id }
        let(:kind) { "images" }
        let(:Authorization) { "Bearer #{bearer_token_for(stranger)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end

      response "422", "invalid kind" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:kind) { "stickers" }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("validation_failed")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
