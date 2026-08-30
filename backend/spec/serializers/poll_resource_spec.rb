require "rails_helper"

RSpec.describe PollResource do
  def live_poll(anonymous: false)
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(
      conversation: conversation, sender: user.account,
      poll: { question: "Who?", options: %w[Ada Eve], is_anonymous: anonymous }
    ).value
    option = message.poll.poll_options.find_by!(label: "Ada")
    Polls::Vote.call(poll: message.poll, actor: user.account, option_ids: [ option.id ])
    [ user, message.poll.reload ]
  end

  it "omits voter identity on an anonymous poll even when results are requested (S-13)" do
    user, poll = live_poll(anonymous: true)
    json = PollResultsResource.new(poll, params: { current_account: user.account }).to_h
    voters = json.fetch("options").flat_map { |row| row.fetch("voters") }

    expect(json.fetch("is_anonymous")).to be(true)
    expect(voters).to eq([])
    expect(json.fetch("options").first.fetch("vote_count")).to eq(1)
  end

  it "includes voter names on a named poll's results sheet" do
    user, poll = live_poll
    json = PollResultsResource.new(poll, params: { current_account: user.account }).to_h
    voters = json.fetch("options").find { |row| row.fetch("label") == "Ada" }.fetch("voters")

    expect(voters).to contain_exactly("account_id" => user.account.id, "display_name" => user.account.display_name)
  end

  it "hides voters on the message payload and marks the viewer's selection" do
    user, poll = live_poll
    json = MessageResource.new(poll.message, params: { current_account: user.account }).to_h.fetch("poll")
    expect(json.fetch("options").flat_map { |row| row.fetch("voters") }).to eq([])
    expect(json.fetch("options").find { |row| row.fetch("label") == "Ada" }.fetch("selected")).to be(true)
  end

  it "does not mark selected without a viewer and skips votes whose account is gone" do
    _user, poll = live_poll
    json = described_class.new(poll).to_h
    expect(json.fetch("options").map { |row| row.fetch("selected") }).to all(be(false))
    poll.poll_votes.each { |vote| allow(vote).to receive(:account).and_return(nil) }
    expect(PollResultsResource.new(poll).to_h.fetch("options").flat_map { |row| row.fetch("voters") }).to eq([])
  end
end
