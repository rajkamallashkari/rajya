require "rails_helper"

RSpec.describe WebPushSubscriptionResource do
  it "serialises id and endpoint" do
    row = create(:web_push_subscription)
    expect(described_class.new(row).to_h).to eq("id" => row.id, "endpoint" => row.endpoint)
  end
end
