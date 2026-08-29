require "rails_helper"

RSpec.describe ApplicationCable::Channel do
  it "is an ActionCable channel" do
    expect(described_class.superclass).to eq(ActionCable::Channel::Base)
  end
end
