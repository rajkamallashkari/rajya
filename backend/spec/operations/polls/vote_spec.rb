require "rails_helper"

RSpec.describe Polls::Vote do
  def setup
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = Messages::Send.call(
      conversation: conversation, sender: user.account,
      poll: { question: "Lunch?", options: %w[Yes No] }
    ).value
    [ user, message.poll ]
  end

  it "records a single-choice vote and marks the option selected for the voter" do
    user, poll = setup
    option = poll.poll_options.find_by!(label: "Yes")
    message = described_class.call(poll: poll, actor: user.account, option_ids: [ option.id ]).value
    json = MessageResource.new(message, params: { current_account: user.account }).to_h.fetch("poll")

    expect(poll.reload.voter_count).to eq(1)
    expect(option.reload.vote_count).to eq(1)
    expect(json.fetch("options").find { |row| row.fetch("id") == option.id }.fetch("selected")).to be(true)
  end

  it "replaces a previous single-choice vote rather than stacking them (S-12)" do
    user, poll = setup
    first, second = poll.poll_options.order(:position)
    described_class.call(poll: poll, actor: user.account, option_ids: [ first.id ])
    described_class.call(poll: poll, actor: user.account, option_ids: [ second.id ])

    expect(poll.poll_votes.where(account: user.account).pluck(:poll_option_id)).to eq([ second.id ])
    expect(first.reload.vote_count).to eq(0)
    expect(second.reload.vote_count).to eq(1)
  end

  it "allows toggling multiple options when the poll allows it, including an empty unvote" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    poll = Messages::Send.call(
      conversation: conversation, sender: user.account,
      poll: { question: "Sides?", options: %w[A B], allows_multiple: true }
    ).value.poll
    ids = poll.poll_options.pluck(:id)
    described_class.call(poll: poll, actor: user.account, option_ids: ids)
    described_class.call(poll: poll, actor: user.account, option_ids: [])

    expect(poll.reload.voter_count).to eq(0)
  end

  it "rejects two options on a single-choice poll and a stranger" do
    user, poll = setup
    ids = poll.poll_options.pluck(:id)
    expect(described_class.call(poll: poll, actor: user.account, option_ids: ids).error_code).to eq(:validation_failed)
    expect(described_class.call(poll: poll, actor: create(:user).account, option_ids: [ ids.first ]).error_code)
      .to eq(:forbidden)
  end

  it "rejects a closed poll and a tombstoned parent" do
    user, poll = setup
    option_id = poll.poll_options.first.id
    Polls::Close.call(poll: poll, actor: user.account)
    expect(described_class.call(poll: poll.reload, actor: user.account, option_ids: [ option_id ]).error_code)
      .to eq(:conflict)
    other = Messages::Send.call(
      conversation: poll.message.conversation, sender: user.account,
      poll: { question: "Gone?", options: %w[Y N] }
    ).value
    Messages::Unsend.call(message: other, actor: user.account)
    expect(described_class.call(poll: other.poll, actor: user.account,
                                option_ids: [ other.poll.poll_options.first.id ]).error_code).to eq(:not_found)
  end

  it "rechecks closed under the row lock" do
    user, poll = setup
    option = poll.poll_options.first
    relation = instance_double(ActiveRecord::Relation, find: poll)
    allow(Poll).to receive(:lock).and_return(relation)
    allow(poll).to receive(:closed?).and_return(false, true)

    expect(described_class.call(poll: poll, actor: user.account, option_ids: [ option.id ]).error_code)
      .to eq(:conflict)
  end

  it "rejects option ids that do not belong to the poll" do
    user, poll = setup
    expect(described_class.call(poll: poll, actor: user.account, option_ids: [ 0 ]).error_code).to eq(:validation_failed)
  end
end
