require "rails_helper"

RSpec.describe ScheduledMessages::DispatchDueJob do
  it "delegates to DispatchDue" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    row = ScheduledMessages::Create.call(
      conversation: conversation, sender: user.account, body: "Due", scheduled_at: 1.hour.from_now
    ).value
    row.update_columns(scheduled_at: 1.minute.ago)

    described_class.perform_now
    expect(conversation.messages.pluck(:body)).to eq([ "Due" ])
  end

  it "is recurring in development and production" do
    config = YAML.safe_load_file(Rails.root.join("config/recurring.yml"))

    %w[development production].each do |environment|
      task = config.dig(environment, "dispatch_scheduled_messages")
      expect(task).to include(
        "class" => "ScheduledMessages::DispatchDueJob",
        "queue" => "default",
        "schedule" => "every 10 seconds"
      )
    end
  end
end
