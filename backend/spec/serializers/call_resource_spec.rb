require "rails_helper"

RSpec.describe CallResource do
  it "includes participants" do
    call = create(:call)
    create(:call_participant, call: call, account: create(:account))
    json = described_class.new(call).to_h

    expect(json.fetch("id")).to eq(call.id)
    expect(json.fetch("participants").size).to eq(1)
  end
end
