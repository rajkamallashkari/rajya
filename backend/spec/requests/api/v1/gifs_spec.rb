require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup -- rswag path groups
RSpec.describe "GIF search", type: :request do
  path "/api/v1/gifs" do
    get "Search GIFs through the Tenor proxy" do
      tags "Media"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :q, in: :query, type: :string

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/GifList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:q) { "party" }

        before do
          create(:feature_flag, key: "gif_search",
                                description: FeatureFlagRegistry.description_for(:gif_search), enabled: true)
          hit = Gifs::Tenor::Result.new(
            id: "t1", title: "Party", preview_url: "https://cdn.example/p.gif", gif_url: "https://cdn.example/g.gif"
          )
          allow(Gifs::Tenor).to receive(:new).and_return(instance_double(Gifs::Tenor, search: [ hit ]))
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("gifs").sole.fetch("id")).to eq("t1")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup
# rubocop:enable RSpec/VariableName
