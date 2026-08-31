require "rails_helper"

RSpec.describe Calls::State do
  it "is a no-op when the call is already terminal (BR-68)" do
    call = create(:call, :ended)

    expect(described_class.mark_ended!(call)).to be_nil
    expect(described_class.mark_missed!(call)).to be_nil
    expect(described_class.mark_declined!(call)).to be_nil
  end

  it "does not compute duration without both timestamps (BR-68)" do
    call = create(:call, :ended, started_at: nil, ended_at: Time.current)
    described_class.compute_duration!(call)
    expect(call.reload.duration_seconds).to be_nil
  end
end
