require "rails_helper"

RSpec.describe Ai::StyleProfiles::Build do
  def enable!(account)
    preference = account.preference || account.create_preference!(data: {})
    preference.merge_ai!("style_profile_enabled" => true)
  end

  def seed_messages(account, count)
    conversation = create_direct_between(account, create(:account))
    count.times do |index|
      Messages::Send.call(conversation: conversation, sender: account, body: "Hello there number #{index} from me")
    end
  end

  it "does not send message history while style_profile_enabled is false (F-11)" do
    account = create(:user).account
    seed_messages(account, 12)
    allow(Ai::Runner).to receive(:chat)

    result = described_class.call(account: account, force: true)

    expect(result.error_code).to eq(:forbidden)
    expect(Ai::Runner).not_to have_received(:chat)
  end

  it "sends sampled history only after explicit opt-in" do
    account = create(:user).account
    enable!(account)
    seed_messages(account, 12)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "Casual, short sentences.", status: "success", provider: "groq", model: "llama")
    )

    result = described_class.call(account: account, force: true)

    expect(result).to be_success
    expect(result.value.profile).to include("Casual")
    expect(account.preference.reload.style_profile_enabled?).to be(true)
    expect(Ai::Runner).to have_received(:chat).with(hash_including(capability: :style_profile))
  end

  it "skips the model when there are too few messages" do
    account = create(:user).account
    enable!(account)
    allow(Ai::Runner).to receive(:chat)

    expect(described_class.call(account: account, force: true).error_code).to eq(:validation_failed)
    expect(Ai::Runner).not_to have_received(:chat)
  end

  it "skips a rebuild when the message delta is under the threshold" do
    account = create(:user).account
    enable!(account)
    seed_messages(account, 12)
    allow(Ai::Runner).to receive(:chat).and_return(
      Ai::Runner::Result.new(text: "Casual.", status: "success", provider: "groq", model: "llama")
    )

    expect(described_class.call(account: account, force: true)).to be_success
    expect(described_class.call(account: account).value.profile).to include("Casual")
    expect(Ai::Runner).to have_received(:chat).once
  end

  it "returns the upstream error when the model fails after opt-in" do
    account = create(:user).account
    enable!(account)
    seed_messages(account, 12)
    allow(Ai::Complete).to receive(:call).and_return(Result.failure(:upstream_failed))

    expect(described_class.call(account: account, force: true).error_code).to eq(:upstream_failed)
  end

  it "treats a non-hash style blob as zero prior messages when deciding rebuild" do
    account = create(:user).account
    enable!(account)
    seed_messages(account, 12)
    account.preference.merge_ai!("style_profile" => "legacy string")
    allow(Ai::Runner).to receive(:chat)

    expect(described_class.call(account: account).value.profile).to eq("legacy string")
    expect(Ai::Runner).not_to have_received(:chat)
  end
end
