require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Join requests index", type: :request do
  path "/api/v1/conversations/{conversation_id}/join_requests" do
    get "List pending join requests" do
      tags "Invites"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/JoinRequestList"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { create(:join_request, conversation: conversation, account: create(:account)) }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("join_requests").size).to eq(1)
        end
      end
    end
  end
end

RSpec.describe "Join requests approve", type: :request do
  path "/api/v1/conversations/{conversation_id}/join_requests/{id}/approve" do
    post "Approve a join request" do
      tags "Invites"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :id, in: :path, type: :integer

      response "200", "approved" do
        schema "$ref" => "#/components/schemas/Conversation"
        let(:user) { create(:user) }
        let(:joiner) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:request_row) { create(:join_request, conversation: conversation, account: joiner.account) }
        let(:conversation_id) { conversation.id }
        let(:id) { request_row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |response|
          ids = JSON.parse(response.body).fetch("members").map { |row| row.dig("account", "id") }
          expect(ids).to include(joiner.account.id)
        end
      end
    end
  end
end

RSpec.describe "Join requests reject", type: :request do
  path "/api/v1/conversations/{conversation_id}/join_requests/{id}/reject" do
    post "Reject a join request" do
      tags "Invites"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_id, in: :path, type: :integer
      parameter name: :id, in: :path, type: :integer

      response "200", "rejected" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:conversation) { create_talk(kind: "group", owner: user.account, members: [ create(:account) ]) }
        let(:request_row) { create(:join_request, conversation: conversation, account: create(:account)) }
        let(:conversation_id) { conversation.id }
        let(:id) { request_row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do |_response|
          expect(request_row.reload).to be_rejected
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
