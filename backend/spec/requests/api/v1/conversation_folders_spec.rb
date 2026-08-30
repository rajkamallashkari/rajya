require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Conversation folders index", type: :request do
  path "/api/v1/conversation_folders" do
    get "List conversation folders" do
      tags "Folders"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/ConversationFolderList"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before { Folders::Create.call(account: user.account, name: "Work") }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("folders").sole.fetch("name")).to eq("Work")
        end
      end
    end

    post "Create a conversation folder" do
      tags "Folders"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          position: { type: :integer }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/ConversationFolder"
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { name: "Work" } }

        run_test! do |response|
          expect(JSON.parse(response.body)).to include("name" => "Work", "conversation_ids" => [])
        end
      end
    end
  end
end

RSpec.describe "Conversation folders update", type: :request do
  path "/api/v1/conversation_folders/{id}" do
    patch "Update a conversation folder" do
      tags "Folders"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { name: { type: :string }, position: { type: :integer } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/ConversationFolder"
        let(:user) { create(:user) }
        let(:folder) { Folders::Create.call(account: user.account, name: "Work").value }
        let(:id) { folder.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { name: "Home" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("name")).to eq("Home")
        end
      end
    end
  end
end

RSpec.describe "Conversation folders destroy", type: :request do
  path "/api/v1/conversation_folders/{id}" do
    delete "Delete a conversation folder" do
      tags "Folders"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "deleted" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:folder) { Folders::Create.call(account: user.account, name: "Work").value }
        let(:id) { folder.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(ConversationFolder.where(id: folder.id)).not_to exist
        end
      end
    end
  end
end

RSpec.describe "Conversation folders reorder", type: :request do
  path "/api/v1/conversation_folders/reorder" do
    patch "Reorder conversation folders" do
      tags "Folders"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: { ids: { type: :array, items: { type: :integer } } }
      }

      response "200", "reordered" do
        schema "$ref" => "#/components/schemas/ConversationFolderList"
        let(:user) { create(:user) }
        let(:first) { Folders::Create.call(account: user.account, name: "A").value }
        let(:second) { Folders::Create.call(account: user.account, name: "B").value }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { ids: [ second.id, first.id ] } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("folders").map { |row| row.fetch("id") })
            .to eq([ second.id, first.id ])
        end
      end
    end
  end
end

RSpec.describe "Conversation folder entries add", type: :request do
  path "/api/v1/conversation_folders/{conversation_folder_id}/conversations" do
    post "Add a conversation to a folder" do
      tags "Folders"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_folder_id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { conversation_id: { type: :integer } }
      }

      response "200", "added" do
        schema "$ref" => "#/components/schemas/ConversationFolder"
        let(:user) { create(:user) }
        let(:folder) { Folders::Create.call(account: user.account, name: "Work").value }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:conversation_folder_id) { folder.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { conversation_id: conversation.id } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("conversation_ids")).to eq([ conversation.id ])
        end
      end
    end
  end
end

RSpec.describe "Conversation folder entries remove", type: :request do
  path "/api/v1/conversation_folders/{conversation_folder_id}/conversations/{conversation_id}" do
    delete "Remove a conversation from a folder" do
      tags "Folders"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :conversation_folder_id, in: :path, type: :integer
      parameter name: :conversation_id, in: :path, type: :integer

      response "200", "removed" do
        schema "$ref" => "#/components/schemas/ConversationFolder"
        let(:user) { create(:user) }
        let(:folder) { Folders::Create.call(account: user.account, name: "Work").value }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:conversation_folder_id) { folder.id }
        let(:conversation_id) { conversation.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          Folders::AddConversation.call(account: user.account, folder: folder, conversation: conversation)
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("conversation_ids")).to eq([])
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
