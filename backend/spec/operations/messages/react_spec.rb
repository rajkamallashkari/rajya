require "rails_helper"

RSpec.describe Messages::React do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    [ user, message ]
  end

  it "adds a reaction, updates the summary, and bumps revision (BR-25, BR-26)" do
    user, message = setup
    described_class.call(message: message, actor: user.account, emoji: "👍")
    message.reload

    expect(message.reaction_summary).to eq("👍" => 1)
    expect(message.revision).to eq(2)
    expect(message.reactions.sole.emoji).to eq("👍")
  end

  it "is idempotent for the same emoji and allows a second distinct emoji" do
    user, message = setup
    described_class.call(message: message, actor: user.account, emoji: "👍")
    described_class.call(message: message, actor: user.account, emoji: "👍")
    described_class.call(message: message, actor: user.account, emoji: "❤️")

    expect(message.reactions.count).to eq(2)
    expect(message.reload.reaction_summary.keys).to contain_exactly("👍", "❤️")
  end

  it "rejects a blank emoji and a stranger" do
    user, message = setup
    stranger = create(:user)

    expect(described_class.call(message: message, actor: user.account, emoji: " ").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(message: message, actor: stranger.account, emoji: "👍").error_code)
      .to eq(:forbidden)
  end

  it "rejects reacting to a deleted message" do
    user, message = setup
    Messages::Unsend.call(message: message, actor: user.account)
    expect(described_class.call(message: message.reload, actor: user.account, emoji: "👍").error_code)
      .to eq(:not_found)
  end

  it "returns the existing row when a concurrent insert wins" do
    user, message = setup
    create(:reaction, message: message, account: user.account, emoji: "🎉")
    relation = Reaction.where(message_id: message.id)
    allow(message).to receive(:reactions).and_return(relation)
    allow(relation).to receive(:find_or_initialize_by).and_raise(ActiveRecord::RecordNotUnique.new("idx"))

    expect(described_class.call(message: message, actor: user.account, emoji: "🎉")).to be_success
  end

  it "rejects an emoji that exceeds the configured length (BR-25)" do
    user, message = setup
    stub_setting(:reaction_emoji_max_length, 1)
    expect(described_class.call(message: message, actor: user.account, emoji: "toolong").error_code)
      .to eq(:validation_failed)
  end
end
