require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers, RSpec/ScatteredSetup -- rswag path groups
RSpec.describe "Admin shell", type: :request do
  path "/api/v1/admin/users" do
    get "List users" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :q, in: :query, type: :string, required: false

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminUserList"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:q) { admin.account.username }

        run_test! do |response|
          ids = JSON.parse(response.body).fetch("users").map { |row| row.fetch("id") }
          expect(ids).to include(admin.id)
        end
      end
    end
  end

  path "/api/v1/admin/users/{id}" do
    get "Show a user and their conversations" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/AdminUserDetail"
        let(:admin) { create(:user, :admin) }
        let(:target) { create(:user) }
        let(:id) { target.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        before { create_direct_between(target.account, create(:account)) }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.dig("user", "id")).to eq(target.id)
          expect(body.fetch("conversations").length).to eq(1)
        end
      end
    end
  end

  path "/api/v1/admin/conversations/{conversation_id}/messages" do
    get "Read any conversation transcript" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :before, in: :query, type: :integer, required: false
      parameter name: :after, in: :query, type: :integer, required: false

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/MessagePage"
        let(:admin) { create(:user, :admin) }
        let(:owner) { create(:user) }
        let(:conversation) { create_direct_between(owner.account, create(:account)) }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }

        before { create(:message, conversation: conversation, sender_account: owner.account, body: "<script>x</script>") }

        run_test! do |response|
          body = JSON.parse(response.body)
          expect(body.fetch("messages").first.fetch("body")).to eq("<script>x</script>")
          expect(AuditEvent.find_by(action: "transcript.read").target_id).to eq(conversation.id)
        end
      end
    end
  end

  path "/api/v1/admin/impersonation" do
    post "Start impersonating an account" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { account_id: { type: :integer } }
      }

      response "200", "started" do
        schema "$ref" => "#/components/schemas/Session"
        let(:admin) { create(:user, :admin) }
        let(:target) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:payload) { { account_id: target.account_id } }

        run_test! do |response|
          token = JSON.parse(response.body).fetch("token")
          claims = Auth::Token.decode(token)
          expect(claims.fetch("account_id").to_i).to eq(target.account_id)
          expect(claims.fetch("impersonator_id").to_i).to eq(admin.id)
          expect(claims.fetch("sub").to_i).to eq(admin.id)
          expect(AuditEvent.find_by(action: "impersonation.start").impersonated_account_id).to eq(target.account_id)
        end
      end
    end

    delete "Stop impersonation" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "stopped" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:admin) { create(:user, :admin) }
        let(:target) { create(:user) }
        let(:Authorization) { impersonation_headers_for(admin, target.account).fetch("Authorization") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("ok")).to be(true)
          expect(AuditEvent.find_by(action: "impersonation.stop").impersonated_account_id).to eq(target.account_id)
        end
      end
    end
  end

  path "/api/v1/admin/audit_events" do
    get "List audit events" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :action_name, in: :query, type: :string, required: false

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminAuditEventList"
        let(:admin) { create(:user, :admin) }
        let(:Authorization) { "Bearer #{bearer_token_for(admin)}" }
        let(:action_name) { "phone.verified" }

        before { create(:audit_event, admin_user: admin, action: "phone.verified") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("audit_events").first.fetch("action")).to eq("phone.verified")
        end
      end
    end
  end

  path "/api/v1/admin/dashboard" do
    get "Admin dashboards" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "shown" do
        schema "$ref" => "#/components/schemas/AdminDashboard"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }

        before { create(:storage_bucket, service_name: "dash") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("buckets").first.fetch("service_name")).to eq("dash")
        end
      end
    end
  end

  path "/api/v1/admin/prompt_templates" do
    get "List prompt templates" do
      tags "Admin"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/AdminPromptTemplateList"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }

        run_test! do |response|
          keys = JSON.parse(response.body).fetch("prompt_templates").map { |row| row.fetch("capability") }
          expect(keys).to include("bot_reply")
        end
      end
    end

    patch "Create a new prompt template version" do
      tags "Admin"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { capability: { type: :string }, template: { type: :string } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/AdminPromptTemplateEnvelope"
        let(:Authorization) { "Bearer #{bearer_token_for(create(:user, :admin))}" }
        let(:payload) { { capability: "bot_reply", template: "Stay kind." } }

        run_test! do |response|
          expect(JSON.parse(response.body).dig("prompt_template", "template")).to eq("Stay kind.")
          expect(Ai::PromptTemplate.fetch(:bot_reply)).to eq("Stay kind.")
        end
      end
    end
  end
end
# rubocop:enable RSpec/VariableName
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers, RSpec/ScatteredSetup
