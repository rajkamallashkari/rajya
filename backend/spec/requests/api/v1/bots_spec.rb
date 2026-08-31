require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Bots directory", type: :request do
  path "/api/v1/bots" do
    get "List active bots" do
      tags "Bots"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/BotList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:bot) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("bots").size).to be >= 1
        end
      end
    end
  end
end

RSpec.describe "Bot show", type: :request do
  path "/api/v1/bots/{id}" do
    get "Show an active bot" do
      tags "Bots"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "visible" do
        schema "$ref" => "#/components/schemas/Bot"
        let(:user) { create(:user) }
        let(:bot) { create(:bot) }
        let(:id) { bot.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("account", "shared_memory")).to be(true)
        end
      end
    end
  end
end

RSpec.describe "Bot requests create", type: :request do
  path "/api/v1/bot_requests" do
    post "Propose a bot" do
      tags "Bots"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          kind: { type: :string },
          target_bot_id: { type: :integer, nullable: true },
          payload: {
            type: :object,
            additionalProperties: true,
            properties: {
              bio: { type: :string },
              name: { type: :string },
              persona_prompt: { type: :string },
              username: { type: :string }
            }
          }
        }
      }

      response "201", "filed" do
        schema "$ref" => "#/components/schemas/BotRequest"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) do
          {
            kind: "create",
            payload: {
              name: "Nimbus", username: "nimbus_bot", bio: "Sky watcher",
              persona_prompt: "A" * Ai::Limits.prompt_minimum_length
            }
          }
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("status")).to eq("pending")
        end
      end
    end
  end
end

RSpec.describe "AI rewrite", type: :request do
  path "/api/v1/ai/rewrite" do
    post "Rewrite draft text" do
      tags "AI"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[text],
        properties: {
          text: { type: :string },
          tones: { type: :array, items: { type: :string } },
          instruction: { type: :string },
          conversation_id: { type: :integer, nullable: true }
        }
      }

      before do
        allow(Ai::Complete).to receive(:call).and_return(
          Result.success(Ai::Runner::Result.new(text: "Hello", status: "success", provider: "groq", model: "llama"))
        )
      end

      response "200", "rewritten" do
        schema "$ref" => "#/components/schemas/Rewrite"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { text: "hey", tones: [ "casual" ] } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("text")).to eq("Hello")
        end
      end

      response "200", "rewritten with conversation context" do
        schema "$ref" => "#/components/schemas/Rewrite"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { text: "hey", instruction: "formal", conversation_id: conversation.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("text")).to eq("Hello")
        end
      end
    end
  end
end

RSpec.describe "Style profile show", type: :request do
  path "/api/v1/style_profile" do
    get "Show style-profile consent and blob" do
      tags "AI"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/StyleProfile"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("enabled")).to be(false)
        end
      end
    end
  end
end

RSpec.describe "Style profile consent", type: :request do
  path "/api/v1/style_profile" do
    patch "Set style-profile consent (F-11)" do
      tags "AI"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        required: %w[enabled],
        properties: { enabled: { type: :boolean } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/StyleProfile"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { enabled: true } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("enabled")).to be(true)
        end
      end
    end

    post "Build the style profile after opt-in (F-11)" do
      tags "AI"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "built" do
        schema "$ref" => "#/components/schemas/StyleProfile"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          preference = user.account.preference || user.account.create_preference!(data: {})
          preference.merge_ai!("style_profile_enabled" => true)
          conversation = create_direct_between(user.account, create(:account))
          12.times do |index|
            Messages::Send.call(
              conversation: conversation, sender: user.account, body: "Hello there number #{index} from me"
            )
          end
          allow(Ai::Complete).to receive(:call).and_return(
            Result.success(
              Ai::Runner::Result.new(text: "Casual, short sentences.", status: "success", provider: "groq", model: "llama")
            )
          )
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("enabled")).to be(true)
        end
      end

      response "403", "refused while consent is off" do
        schema "$ref" => "#/components/schemas/Error"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("error", "code")).to eq("forbidden")
        end
      end
    end
  end
end

RSpec.describe "Bot requests index", type: :request do
  path "/api/v1/bot_requests" do
    get "List the current account's bot proposals" do
      tags "Bots"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/BotRequestList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("bot_requests")).to eq([])
        end
      end
    end
  end
end

RSpec.describe "Bot deactivate", type: :request do
  path "/api/v1/bots/{id}" do
    delete "Deactivate a bot (BR-81)" do
      tags "Bots"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "deactivated" do
        schema "$ref" => "#/components/schemas/Bot"
        let(:user) { create(:user) }
        let(:bot) { create(:bot, owner_account: user.account) }
        let(:id) { bot.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("id")).to eq(bot.id)
          expect(bot.account.reload.deactivated_at).to be_present
        end
      end
    end
  end
end

RSpec.describe "Bot request destroy", type: :request do
  path "/api/v1/bot_requests/{id}" do
    delete "Withdraw a pending proposal" do
      tags "Bots"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "withdrawn" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:request) { create(:bot_request, requester_account: user.account) }
        let(:id) { request.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(BotRequest.where(id: request.id)).not_to exist
        end
      end
    end
  end
end

RSpec.describe "Admin bot requests", type: :request do
  path "/api/v1/admin/bot_requests" do
    get "List bot proposals" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/BotRequestList"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("bot_requests")).to eq([])
        end
      end
    end
  end
end

RSpec.describe "Admin bot request approve", type: :request do
  path "/api/v1/admin/bot_requests/{id}/approve" do
    post "Approve a bot proposal" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "approved" do
        schema "$ref" => "#/components/schemas/Bot"
        let(:admin) { create(:user, :admin) }
        let(:request) do
          create(
            :bot_request, requester_account: create(:user).account, kind: "create",
            payload: {
              "name" => "Nimbus", "username" => "nimbus_ok", "bio" => "Sky",
              "persona_prompt" => "A" * Ai::Limits.prompt_minimum_length
            }
          )
        end
        let(:id) { request.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("owner_account_id")).to eq(request.requester_account_id)
        end
      end
    end
  end
end

RSpec.describe "Admin bot request decline", type: :request do
  path "/api/v1/admin/bot_requests/{id}/decline" do
    post "Decline a bot proposal" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { reason: { type: :string } }
      }

      response "200", "declined" do
        schema "$ref" => "#/components/schemas/BotRequest"
        let(:admin) { create(:user, :admin) }
        let(:request) { create(:bot_request, requester_account: create(:user).account) }
        let(:id) { request.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { reason: "Too thin" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("status")).to eq("declined")
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
