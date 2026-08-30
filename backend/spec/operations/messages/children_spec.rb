require "rails_helper"

RSpec.describe Messages::Children do
  it "copies poll options without votes onto a forward" do
    user = create(:user)
    source = create_direct_between(user.account, create(:account))
    target = create_direct_between(user.account, create(:account))
    original = Messages::Send.call(
      conversation: source, sender: user.account,
      poll: { question: "Copy?", options: %w[Yes No] }
    ).value
    Polls::Vote.call(poll: original.poll, actor: user.account, option_ids: [ original.poll.poll_options.first.id ])
    copy = Messages::Forward.call(message: original, actor: user.account, target: target).value

    expect(copy.poll.question).to eq("Copy?")
    expect(copy.poll.voter_count).to eq(0)
    expect(copy.poll.poll_votes).to be_empty
  end

  it "copies a static location and contact cards onto a forward" do
    user = create(:user)
    source = create_direct_between(user.account, create(:account))
    target = create_direct_between(user.account, create(:account))
    original = Messages::Send.call(
      conversation: source, sender: user.account,
      location: { latitude: "1.0", longitude: "2.0" },
      contacts: [ { display_name: "Ada" } ]
    ).value
    copy = Messages::Forward.call(message: original, actor: user.account, target: target).value

    expect(copy.message_location.latitude).to eq(original.message_location.latitude)
    expect(copy.message_contacts.first.display_name).to eq("Ada")
  end

  it "parses blank, Time, and ISO closes_at values" do
    expect(described_class.parse_time(nil)).to be_nil
    expect(described_class.parse_time(Time.current)).to be_a(Time)
    expect(described_class.parse_time(1.hour.from_now.iso8601)).to be_a(ActiveSupport::TimeWithZone)
  end

  it "normalizes blank hashes and request parameters" do
    expect(described_class.indifferent(nil)).to eq({})
    expect(described_class.indifferent(ActionController::Parameters.new("question" => "Q"))[:question]).to eq("Q")
  end
end
