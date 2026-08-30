require "swagger_helper"

# rubocop:disable RSpec/VariableName
# rubocop:disable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers -- rswag path groups
RSpec.describe "Message reminders index", type: :request do
  path "/api/v1/message_reminders" do
    get "List pending message reminders" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]

      response "200", "listed" do
        schema "$ref" => "#/components/schemas/MessageReminderList"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        before do
          MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now)
        end

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("message_reminders").size).to eq(1)
        end
      end
    end

    post "Create a message reminder" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :payload, in: :body, schema: {
        type: :object,
        properties: {
          message_id: { type: :integer },
          remind_at: { type: :string, format: :"date-time" },
          note: { type: :string }
        }
      }

      response "201", "created" do
        schema "$ref" => "#/components/schemas/MessageReminder"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { message_id: message.id, remind_at: 1.hour.from_now.iso8601, note: "Ping" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("message_id")).to eq(message.id)
        end
      end
    end
  end
end

RSpec.describe "Message reminders update", type: :request do
  path "/api/v1/message_reminders/{id}" do
    patch "Update a message reminder" do
      tags "Messages"
      consumes "application/json"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer
      parameter name: :payload, in: :body, schema: {
        type: :object, properties: { remind_at: { type: :string, format: :"date-time" }, note: { type: :string } }
      }

      response "200", "updated" do
        schema "$ref" => "#/components/schemas/MessageReminder"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:row) do
          MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
        end
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { note: "Later" } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("note")).to eq("Later")
        end
      end

      response "200", "updated time without a note key" do
        schema "$ref" => "#/components/schemas/MessageReminder"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:row) do
          MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
        end
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }
        let(:payload) { { remind_at: 2.hours.from_now.iso8601 } }

        run_test! do |response|
          expect(JSON.parse(response.body).fetch("id")).to eq(row.id)
        end
      end
    end
  end
end

RSpec.describe "Message reminders destroy", type: :request do
  path "/api/v1/message_reminders/{id}" do
    delete "Cancel a message reminder" do
      tags "Messages"
      produces "application/json"
      security [ { bearerAuth: [] } ]
      parameter name: :id, in: :path, type: :integer

      response "200", "cancelled" do
        schema "$ref" => "#/components/schemas/Ok"
        let(:user) { create(:user) }
        let(:conversation) { create_direct_between(user.account, create(:account)) }
        let(:message) { Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value }
        let(:row) do
          MessageReminders::Create.call(account: user.account, message: message, remind_at: 1.hour.from_now).value
        end
        let(:id) { row.id }
        let(:Authorization) { "Bearer #{bearer_token_for(user)}" }

        run_test! do
          expect(MessageReminder.where(id: row.id)).not_to exist
        end
      end
    end
  end
end
# rubocop:enable RSpec/EmptyExampleGroup, RSpec/MultipleDescribes, RSpec/MultipleMemoizedHelpers
# rubocop:enable RSpec/VariableName
