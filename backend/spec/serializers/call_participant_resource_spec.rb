require "rails_helper"

RSpec.describe CallParticipantResource do
  it "serializes status timestamps" do
    row = create(:call_participant, :joined)
    json = described_class.new(row).to_h

    expect(json).to include(
      "account_id" => row.account_id,
      "status" => "joined",
      "is_screen_sharing" => false
    )
  end
end
