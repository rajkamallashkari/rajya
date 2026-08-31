require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup -- rswag path groups
RSpec.describe "Conversation slash commands", type: :request do
  path "/api/v1/conversations/{id}/commands" do
    get "List slash commands available in a conversation" do
      tags "Bots"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/SlashCommandList"
        let(:user) { create(:user) }
        let(:bot) { create(:bot) }
        let(:conversation) { create_direct_between(user.account, bot.account) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          create(:bot_command, bot: bot, name: "plan", description: "Turn a goal into steps",
                 usage_hint: "/plan <goal>")
        end

        run_test! do |response|
          names = JSON.parse(response.body).fetch("commands").pluck("name")
          expect(names).to include("help", "plan", "sticker")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup
# rubocop:enable RSpec/VariableName
