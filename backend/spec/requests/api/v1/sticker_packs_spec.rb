require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Sticker packs index", type: :request do
  path "/api/v1/sticker_packs" do
    get "List sticker and emoji packs" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/StickerPackList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:sticker_pack, :published, name: "Waves", owner_account: user.account) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("sticker_packs").sole.fetch("name")).to eq("Waves")
        end
      end
    end

    post "Create a sticker pack" do
      tags "Media"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          kind: { type: :string, enum: %w[sticker emoji] },
          slug: { type: :string },
          position: { type: :integer }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/StickerPack"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { name: "Waves", kind: "sticker" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("name" => "Waves", "kind" => "sticker")
        end
      end
    end
  end
end

RSpec.describe "Sticker packs update", type: :request do
  path "/api/v1/sticker_packs/{id}" do
    patch "Update a sticker pack" do
      tags "Media"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          position: { type: :integer },
          published: { type: :boolean }
        }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/StickerPack"
        let(:user) { create(:user) }
        let(:pack) { create(:sticker_pack, owner_account: user.account) }
        let(:id) { pack.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { published: true } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("published_at")).to be_present
        end
      end
    end
  end
end

RSpec.describe "Sticker packs destroy", type: :request do
  path "/api/v1/sticker_packs/{id}" do
    delete "Delete a sticker pack" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "deleted" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:pack) { create(:sticker_pack, owner_account: user.account) }
        let(:id) { pack.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(StickerPack.where(id: pack.id)).not_to exist
        end
      end
    end
  end
end

RSpec.describe "Sticker pack stickers create", type: :request do
  path "/api/v1/sticker_packs/{sticker_pack_id}/stickers" do
    post "Add a sticker to a pack" do
      tags "Media"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :sticker_pack_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          signed_id: { type: :string },
          shortcode: { type: :string },
          position: { type: :integer }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/Sticker"
        let(:user) { create(:user) }
        let(:pack) { create(:sticker_pack, owner_account: user.account) }
        let(:sticker_pack_id) { pack.id }
        let(:blob) do
          ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
        end
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { signed_id: blob.signed_id, shortcode: "wave" } }

        before { create(:storage_bucket, service_name: "test") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("shortcode")).to eq("wave")
        end
      end
    end
  end
end

RSpec.describe "Sticker pack stickers destroy", type: :request do
  path "/api/v1/sticker_packs/{sticker_pack_id}/stickers/{id}" do
    delete "Remove a sticker from a pack" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :sticker_pack_id, in: :path, type: :integer
      parameter name: :id, in: :path, type: :integer

      response "200", "deleted" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:pack) { create(:sticker_pack, owner_account: user.account) }
        let(:sticker) { create(:sticker, sticker_pack: pack) }
        let(:sticker_pack_id) { pack.id }
        let(:id) { sticker.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(Sticker.where(id: sticker.id)).not_to exist
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
