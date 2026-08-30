require "rails_helper"

RSpec.describe Polls::Vote, :concurrent do
  it "keeps one vote per account when two single-choice votes race (S-12)" do
    user = create(:user)
    poll = Messages::Send.call(
      conversation: create_direct_between(user.account, create(:account)), sender: user.account,
      poll: { question: "Race?", options: %w[Yes No] }
    ).value.poll
    first, second = poll.poll_options.order(:position)
    Array.new(2) do |index|
      option = index.zero? ? first : second
      Thread.new { Rails.application.executor.wrap { described_class.call(poll: poll, actor: user.account, option_ids: [ option.id ]) } }
    end.each(&:join)

    expect(poll.poll_votes.where(account: user.account).count).to eq(1)
  end
end
