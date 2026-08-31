require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Message translate", type: :request do
  path "/api/v1/messages/{id}/translate" do
    post "Translate a message (BR-86)" do
      tags "AI"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[target_language],
        properties: {
          target_language: { type: :string },
          source_language: { type: :string, nullable: true }
        }
      }

      response "200", "translated" do
        schema "$ref" => "#/components/schemas/Translation"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hola").value }
        let(:id) { message.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { target_language: "en" } }

        before do
          allow(Ai::Complete).to receive(:call).and_return(
            Result.success(Ai::Runner::Result.new(text: "Hello", status: "success", provider: "groq", model: "llama"))
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("text" => "Hello", "cached" => false)
        end
      end
    end
  end
end

RSpec.describe "Suggest replies", type: :request do
  path "/api/v1/conversations/{id}/suggest_replies" do
    post "Suggest reply chips" do
      tags "AI"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[message_id],
        properties: { message_id: { type: :integer } }
      }

      response "200", "suggested" do
        schema "$ref" => "#/components/schemas/SuggestReplies"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Ping").value }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { message_id: message.id } }

        before do
          allow(Ai::Complete).to receive(:call).and_return(
            Result.success(Ai::Runner::Result.new(text: "On my way\nLater", status: "success", provider: "groq", model: "llama"))
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("suggestions")).to include("On my way")
        end
      end
    end
  end
end

RSpec.describe "Conversation summarize", type: :request do
  path "/api/v1/conversations/{id}/summarize" do
    post "Summarize unread or recent messages" do
      tags "AI"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { mode: { type: :string, enum: %w[unread recent] } }
      }

      response "200", "summarized" do
        schema "$ref" => "#/components/schemas/Summary"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { mode: "recent" } }

        before do
          Messages::Send.call(conversation: conversation, sender: user.account, body: "We should ship Friday")
          allow(Ai::Complete).to receive(:call).and_return(
            Result.success(Ai::Runner::Result.new(text: "Ship Friday", status: "success", provider: "groq", model: "llama"))
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("text" => "Ship Friday", "mode" => "recent")
        end
      end
    end
  end
end

RSpec.describe "Translate arbitrary text", type: :request do
  path "/api/v1/ai/translate_text" do
    post "Translate arbitrary text" do
      tags "AI"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[text target_language],
        properties: {
          text: { type: :string },
          target_language: { type: :string },
          source_language: { type: :string, nullable: true }
        }
      }

      response "200", "translated" do
        schema "$ref" => "#/components/schemas/Translation"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { text: "Hola", target_language: "en" } }

        before do
          allow(Ai::Complete).to receive(:call).and_return(
            Result.success(Ai::Runner::Result.new(text: "Hello", status: "success", provider: "groq", model: "llama"))
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("text")).to eq("Hello")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
