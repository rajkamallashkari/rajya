require "rails_helper"

RSpec.describe Push::Fanout do
  it "returns the recipient list in one call (F-19)" do
    result = described_class.call(
      event: :message_created,
      payload: { "message_id" => 1 },
      recipient_account_ids: [ 2, 3 ]
    )

    expect(result).to be_success
    expect(result.value.fetch(:recipient_account_ids)).to eq([ 2, 3 ])
    expect(result.value.fetch(:event)).to eq("message_created")
  end
end
