require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Admin reports", type: :request do
  path "/api/v1/admin/reports" do
    get "List the moderation queue" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :status, in: :query, type: :string, required: false
      parameter name: :subject_type, in: :query, type: :string, required: false
      parameter name: :max_age_hours, in: :query, type: :integer, required: false

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminReportList"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:status) { "pending" }
        let(:subject_type) { "account" }
        let(:max_age_hours) { 24 }

        before { create(:report, reporter_account: create(:account), reason: "spam") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("reports").first.fetch("reason")).to eq("spam")
        end
      end
    end
  end

  path "/api/v1/admin/reports/{id}" do
    get "Show a report with subject context" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/AdminReport"
        let(:admin) { create(:user, :admin) }
        let(:target) { create(:account) }
        let(:report) { create(:report, subject_type: "account", subject_id: target.id) }
        let(:id) { report.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("subject", "id")).to eq(target.id)
        end
      end
    end
  end

  path "/api/v1/admin/reports/{id}/dismiss" do
    post "Dismiss a report" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { note: { type: :string } }
      }

      response "200", "dismissed" do
        schema "$ref" => "#/components/schemas/AdminReport"
        let(:admin) { create(:user, :admin) }
        let(:report) { create(:report) }
        let(:id) { report.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { note: "noise" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("status")).to eq("dismissed")
          expect(AuditEvent.find_by!(action: "moderation.dismiss").admin_user_id).to eq(admin.id)
        end
      end
    end
  end

  path "/api/v1/admin/reports/{id}/warn" do
    post "Warn the reported account" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { note: { type: :string } }
      }

      response "200", "actioned" do
        schema "$ref" => "#/components/schemas/AdminReport"
        let(:admin) { create(:user, :admin) }
        let(:target) { create(:user) }
        let(:report) { create(:report, subject_type: "account", subject_id: target.account_id) }
        let(:id) { report.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { {} }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("status")).to eq("actioned")
          expect(AuditEvent.find_by(action: "moderation.warn")).to be_present
        end
      end
    end
  end

  path "/api/v1/admin/reports/{id}/remove_content" do
    post "Remove reported content" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "actioned" do
        schema "$ref" => "#/components/schemas/AdminReport"
        let(:admin) { create(:user, :admin) }
        let(:conversation) { create_direct_between(create(:account), create(:account)) }
        let(:message) do
          create(:message, conversation: conversation, sender_account: conversation.accounts.first)
        end
        let(:report) { create(:report, subject_type: "message", subject_id: message.id) }
        let(:id) { report.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        run_test! do
          expect(message.reload).to be_deleted
          expect(AuditEvent.find_by(action: "moderation.remove_content")).to be_present
        end
      end
    end
  end

  path "/api/v1/admin/reports/{id}/deactivate_account" do
    post "Deactivate the reported account" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "actioned" do
        schema "$ref" => "#/components/schemas/AdminReport"
        let(:admin) { create(:user, :admin) }
        let(:target) { create(:user) }
        let(:report) { create(:report, subject_type: "account", subject_id: target.account_id) }
        let(:id) { report.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        run_test! do
          expect(target.account.reload).to be_deactivated
          expect(AuditEvent.find_by(action: "moderation.deactivate_account")).to be_present
        end
      end
    end
  end
end

RSpec.describe "Admin sticker packs", type: :request do
  path "/api/v1/admin/sticker_packs" do
    get "List system sticker packs" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/StickerPackList"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        before { create(:sticker_pack, :system, name: "Waves") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("sticker_packs").sole.fetch("name")).to eq("Waves")
        end
      end
    end

    post "Create a system sticker pack" do
      tags "Admin"
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
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { name: "Waves", kind: "sticker" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("name" => "Waves", "owner_account_id" => nil)
        end
      end
    end
  end

  path "/api/v1/admin/sticker_packs/reorder" do
    patch "Reorder system sticker packs" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { ids: { type: :array, items: { type: :integer } } }
      }

      response "200", "reordered" do
        schema "$ref" => "#/components/schemas/StickerPackList"
        let(:admin) { create(:user, :admin) }
        let(:first) { create(:sticker_pack, :system, position: 0) }
        let(:second) { create(:sticker_pack, :system, position: 1) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { ids: [ second.id, first.id ] } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("sticker_packs").map { |row| row.fetch("id") })
            .to eq([ second.id, first.id ])
        end
      end
    end
  end

  path "/api/v1/admin/sticker_packs/{id}" do
    patch "Update a system sticker pack" do
      tags "Admin"
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
        let(:admin) { create(:user, :admin) }
        let(:pack) { create(:sticker_pack, :system) }
        let(:id) { pack.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { published: true, name: "Official" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("published_at")).to be_present
        end
      end
    end

    delete "Delete a system sticker pack" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "deleted" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:admin) { create(:user, :admin) }
        let(:pack) { create(:sticker_pack, :system) }
        let(:id) { pack.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        run_test! do
          expect(StickerPack.where(id: pack.id)).not_to exist
        end
      end
    end
  end
end

RSpec.describe "Admin sticker pack stickers", type: :request do
  path "/api/v1/admin/sticker_packs/{sticker_pack_id}/stickers" do
    post "Add a sticker to a system pack" do
      tags "Admin"
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
        let(:admin) { create(:user, :admin) }
        let(:pack) { create(:sticker_pack, :system) }
        let(:sticker_pack_id) { pack.id }
        let(:blob) do
          ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
        end
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { signed_id: blob.signed_id, shortcode: "wave" } }

        before do
          create(:storage_bucket, service_name: "test")
          StorageQuota.ensure_for!(admin.account)
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("shortcode")).to eq("wave")
          expect(StorageQuota.find(admin.account.id).used_bytes).to eq(0)
        end
      end
    end
  end

  path "/api/v1/admin/sticker_packs/{sticker_pack_id}/stickers/{id}" do
    delete "Remove a sticker from a system pack" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :sticker_pack_id, in: :path, type: :integer
      parameter name: :id, in: :path, type: :integer

      response "200", "deleted" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:admin) { create(:user, :admin) }
        let(:pack) { create(:sticker_pack, :system) }
        let(:sticker) { create(:sticker, sticker_pack: pack) }
        let(:sticker_pack_id) { pack.id }
        let(:id) { sticker.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        run_test! do
          expect(Sticker.where(id: sticker.id)).not_to exist
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
