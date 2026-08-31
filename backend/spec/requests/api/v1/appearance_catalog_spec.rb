require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes -- rswag path groups
RSpec.describe "Conversations wallpaper", type: :request do
  path "/api/v1/conversations/{id}/wallpaper" do
    patch "Set the viewer's per-conversation wallpaper (NR-42)" do
      tags "Conversations"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { wallpaper: { "$ref" => "#/components/schemas/Wallpaper", nullable: true } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { wallpaper: { preset: "dusk", dim: 0.1, blur: 0.2 } } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("wallpaper")).to include(
            "preset" => "dusk", "dim" => 0.1, "blur" => 0.2
          )
        end
      end

      response "422", "invalid wallpaper" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { wallpaper: { preset: "neon" } } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("validation_failed")
        end
      end
    end
  end
end

RSpec.describe "Font configs index", type: :request do
  path "/api/v1/font_configs" do
    get "List the curated font catalogue" do
      tags "Preferences"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/FontConfigList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:font_config, name: "Inter", position: 0) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("font_configs").sole.fetch("name")).to eq("Inter")
        end
      end
    end
  end
end

RSpec.describe "Accent configs index", type: :request do
  path "/api/v1/accent_configs" do
    get "List the curated accent catalogue" do
      tags "Preferences"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AccentConfigList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:global_accent_config, id: "cyber_indigo", label: "Cyber indigo") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("accent_configs").sole.fetch("id")).to eq("cyber_indigo")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes
# rubocop:enable RSpec/VariableName

RSpec.describe "Appearance catalogues omit inactive rows", type: :request do
  it "lists only active fonts" do
    user = create(:user)
    create(:font_config, name: "Inter", position: 0)
    create(:font_config, name: "Hidden", is_active: false)
    get "/api/v1/font_configs", headers: auth_headers_for(user)
    expect(JSON.parse(response.body).fetch("font_configs").map { |row| row.fetch("name") }).to eq([ "Inter" ])
  end

  it "lists only active accents" do
    user = create(:user)
    create(:global_accent_config, id: "cyber_indigo", label: "Cyber indigo")
    create(:global_accent_config, id: "hidden", label: "Hidden", is_active: false)
    get "/api/v1/accent_configs", headers: auth_headers_for(user)
    expect(JSON.parse(response.body).fetch("accent_configs").map { |row| row.fetch("id") }).to eq([ "cyber_indigo" ])
  end

  it "clears a conversation wallpaper override" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    Conversations::UpdateWallpaper.call(
      account: user.account, conversation: conversation, wallpaper: { "preset" => "grove" }
    )
    patch "/api/v1/conversations/#{conversation.id}/wallpaper",
          headers: auth_headers_for(user), as: :json, params: { wallpaper: nil }
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).fetch("wallpaper")).to be_nil
  end

  it "rejects a non-object wallpaper payload from the controller" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    patch "/api/v1/conversations/#{conversation.id}/wallpaper",
          headers: auth_headers_for(user), as: :json, params: { wallpaper: "dusk" }
    expect(response).to have_http_status(:unprocessable_content)
  end
end
