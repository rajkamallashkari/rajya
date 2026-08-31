require "rails_helper"

RSpec.describe Ai::SuggestReplies do
  it "returns short chips for a live message" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Are you free?").value
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "Yes\nGive me 10", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: user.account, conversation: conversation, message_id: message.id)
    expect(result.value.suggestions).to eq([ "Yes", "Give me 10" ])
  end

  it "strips list prefixes and includes a style-profile prompt" do # rubocop:disable RSpec/ExampleLength
    user = create(:user)
    preference = user.account.preference || user.account.create_preference!(data: {})
    preference.merge_ai!("style_profile_enabled" => true, "style_profile" => { "global" => "Short." })
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    allow(Ai::Complete).to receive(:call).and_return(
      Result.success(Ai::Runner::Result.new(text: "1. Yes", status: "success", provider: "groq", model: "llama"))
    )

    result = described_class.call(account: user.account, conversation: conversation, message_id: message.id)
    expect(result.value.suggestions).to eq([ "Yes" ])
    expect(Ai::Complete).to have_received(:call).with(
      hash_including(messages: array_including(hash_including(content: a_string_including("Match this writing style"))))
    )
  end

  it "404s a missing or deleted target" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    expect(described_class.call(account: user.account, conversation: conversation, message_id: 0).error_code)
      .to eq(:not_found)
  end

  it "404s a deleted target" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Ping").value
    message.update!(deleted_at: Time.current)
    expect(described_class.call(account: user.account, conversation: conversation, message_id: message.id)
                          .error_code).to eq(:not_found)
  end

  it "404s a missing conversation, a blank body, and an upstream failure" do # rubocop:disable RSpec/ExampleLength
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    blank = Messages::Send.call(conversation: conversation, sender: user.account, body: "Ping").value
    blank.update_columns(body: "")
    expect(described_class.call(account: user.account, conversation: nil, message_id: 1).error_code)
      .to eq(:not_found)
    expect(described_class.call(account: user.account, conversation: conversation, message_id: blank.id)
                          .error_code).to eq(:not_found)

    message = Messages::Send.call(conversation: conversation, sender: user.account, body: "Hi").value
    allow(Ai::Complete).to receive(:call).and_return(Result.failure(:upstream_failed))
    expect(described_class.call(account: user.account, conversation: conversation, message_id: message.id)
                          .error_code).to eq(:upstream_failed)
  end
end
