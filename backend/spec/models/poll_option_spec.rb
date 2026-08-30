require "rails_helper"

RSpec.describe PollOption do
  it "requires a label" do
    expect(build(:poll_option, label: "")).not_to be_valid
  end
end
