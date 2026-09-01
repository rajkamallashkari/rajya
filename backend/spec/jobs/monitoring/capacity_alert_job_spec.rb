require "rails_helper"

RSpec.describe Monitoring::CapacityAlertJob do
  it "delegates to AlertCapacity" do
    allow(Monitoring::AlertCapacity).to receive(:call).and_return(Result.success([]))

    described_class.perform_now

    expect(Monitoring::AlertCapacity).to have_received(:call)
  end
end
