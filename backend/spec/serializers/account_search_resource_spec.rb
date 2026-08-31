require "rails_helper"

RSpec.describe AccountSearchResource do
  it "serializes accounts without nicknames" do
    account = create(:account)
    json = described_class.new(Search::AccountPayload.new(accounts: [ account ])).to_h

    expect(json.fetch("accounts").sole.keys).not_to include("nickname")
  end
end
