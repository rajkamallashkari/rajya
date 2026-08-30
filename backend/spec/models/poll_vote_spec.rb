require "rails_helper"

RSpec.describe PollVote do
  it "stamps created_at on insert" do
    vote = create(:poll_vote)
    expect(vote.created_at).to be_present
  end
end
