require "rails_helper"

RSpec.describe Ai::BuildStyleProfileJob do
  it "delegates to Build" do
    account = create(:user).account
    allow(Ai::StyleProfiles::Build).to receive(:call).and_return(Result.success(nil))

    described_class.perform_now(account.id, true)

    expect(Ai::StyleProfiles::Build).to have_received(:call).with(account: account, force: true)
  end

  it "no-ops when the account is gone" do
    allow(Ai::StyleProfiles::Build).to receive(:call)
    described_class.perform_now(0)
    expect(Ai::StyleProfiles::Build).not_to have_received(:call)
  end
end
