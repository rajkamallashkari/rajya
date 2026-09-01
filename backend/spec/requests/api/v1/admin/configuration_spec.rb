require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/ScatteredSetup -- rswag path groups
RSpec.describe "Admin configuration", type: :request do
  path "/api/v1/admin/settings" do
    get "List registry settings with current values" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminSettingList"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }

        run_test! do |response|
          keys = JSON.parse(response.body).fetch("settings").map { |row| row.fetch("key") }
          expect(keys).to include("message_edit_window")
        end
      end
    end

    patch "Override a registered setting" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { key: { type: :string }, value: {} }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/AdminSettingEnvelope"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }
        let(:payload) { { key: "message_edit_window", value: 120 } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("setting", "value")).to eq(120)
          expect(Settings.fetch(:message_edit_window)).to eq(120)
        end
      end
    end

    delete "Reset a setting to its code default" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :key, in: :query, type: :string

      response "200", "reset" do
        schema "$ref" => "#/components/schemas/AdminSettingEnvelope"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:key) { "message_edit_window" }

        before { AppSetting.create!(key: "message_edit_window", value: 60, category: "messaging") }

        run_test! do
          expect(Settings.fetch(:message_edit_window)).to eq(900)
        end
      end
    end
  end

  path "/api/v1/admin/feature_flags" do
    get "List feature flags with defaults and rollout" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminFeatureFlagList"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }

        run_test! do |response|
          row = JSON.parse(response.body).fetch("feature_flags").find { |flag| flag.fetch("key") == "webrtc_calls" }
          expect(row.fetch("default")).to be(false)
        end
      end
    end

    patch "Toggle a flag and set rollout" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          key: { type: :string },
          enabled: { type: :boolean },
          rollout: { type: :object, additionalProperties: true }
        }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/AdminFeatureFlagEnvelope"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }
        let(:payload) { { key: "webrtc_calls", enabled: true, rollout: {} } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("feature_flag", "enabled")).to be(true)
          expect(FeatureFlag.enabled?(:webrtc_calls)).to be(true)
        end
      end
    end
  end

  path "/api/v1/admin/translation_strings" do
    get "List the string catalogue" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :q, in: :query, type: :string, required: false
      parameter name: :surface, in: :query, type: :string, required: false
      parameter name: :locale, in: :query, type: :string, required: false

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminTranslationStringList"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }

        run_test! do |response|
          keys = JSON.parse(response.body).fetch("translation_strings").map { |row| row.fetch("key") }
          expect(keys).to include("errors.not_found")
        end
      end
    end

    patch "Override a catalogue string" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { key: { type: :string }, locale: { type: :string }, value: { type: :string } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/AdminTranslationStringEnvelope"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }
        let(:payload) { { key: "errors.not_found", locale: "en", value: "Missing." } }

        run_test! do
          expect(Catalog.t("errors.not_found")).to eq("Missing.")
        end
      end
    end

    delete "Reset a catalogue string to its default" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :key, in: :query, type: :string
      parameter name: :locale, in: :query, type: :string, required: false

      response "200", "reset" do
        schema "$ref" => "#/components/schemas/AdminTranslationStringEnvelope"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:key) { "errors.not_found" }
        let(:locale) { "en" }

        before do
          TranslationString.create!(key: "errors.not_found", locale: "en", value: "Gone.", updated_by_user: admin)
        end

        run_test! do
          expect(Catalog.t("errors.not_found")).to eq("The requested resource could not be found.")
        end
      end
    end
  end

  path "/api/v1/admin/theme_overrides" do
    get "List semantic colour tokens" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminThemeOverrideList"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }

        run_test! do |response|
          tokens = JSON.parse(response.body).dig("themes", "light").map { |row| row.fetch("token_name") }
          expect(tokens).to include("--text-primary")
          expect(tokens).not_to include("--gray-500")
        end
      end
    end

    patch "Set a semantic colour token" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { theme: { type: :string }, token_name: { type: :string }, value: { type: :string } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/AdminThemeOverrideEnvelope"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }
        let(:payload) { { theme: "light", token_name: "--text-primary", value: "#0F172A" } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("override", "value")).to eq("#0F172A")
        end
      end

      response "422", "low contrast" do
        schema "$ref" => "#/components/schemas/Error"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }
        let(:payload) { { theme: "light", token_name: "--text-primary", value: "#EFF6FF" } }

        run_test! do |response|
          details = JSON.parse(response.body).fetch("error").fetch("details")
          expect(details.fetch("pair")).to eq("token" => "--text-primary", "against" => "--surface-app")
        end
      end
    end

    delete "Reset colour tokens" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :theme, in: :query, type: :string, required: false
      parameter name: :token_name, in: :query, type: :string, required: false

      response "200", "reset" do
        schema "$ref" => "#/components/schemas/AdminThemeOverrideList"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        before { create(:theme_override, theme: "light", token_name: "--text-primary", value: "#0F172A") }

        run_test! do
          expect(ThemeOverride.count).to eq(0)
        end
      end
    end
  end

  path "/api/v1/theme_overrides" do
    get "Fetch merged admin colour overrides for applyTheme" do
      tags "Appearance"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "palettes" do
        schema "$ref" => "#/components/schemas/ThemeOverridePalette"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user))}" }

        before { create(:theme_override, theme: "light", token_name: "--text-primary", value: "#0F172A") }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("light", "--text-primary")).to eq("#0F172A")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/ScatteredSetup
# rubocop:enable RSpec/VariableName
