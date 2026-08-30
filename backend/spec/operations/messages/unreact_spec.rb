require "rails_helper"

RSpec.describe Messages::Unreact do
  it "removes the actor's emoji and refreshes the summary" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    Messages::React.call(message: message, actor: user.account, emoji: "👍")
    Messages::React.call(message: message, actor: user.account, emoji: "❤️")
    described_class.call(message: message, actor: user.account, emoji: "👍")
    message.reload

    expect(message.reactions.pluck(:emoji)).to eq([ "❤️" ])
    expect(message.reaction_summary).to eq("❤️" => 1)
  end

  it "is a no-op when the emoji is absent and forbids a stranger" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    stranger = create(:user)

    expect(described_class.call(message: message, actor: user.account, emoji: "👍")).to be_success
    expect(described_class.call(message: message, actor: stranger.account, emoji: "👍").error_code)
      .to eq(:forbidden)
  end
end
