require "rails_helper"

RSpec.describe Ai::StyleProfiles::UpdateConsent do
  it "opts the account in without sending history" do
    account = create(:user).account
    allow(Ai::Runner).to receive(:chat)

    result = described_class.call(account: account, enabled: true)

    expect(result.value.enabled).to be(true)
    expect(Ai::Runner).not_to have_received(:chat)
  end

  it "opts the account back out" do
    account = create(:user).account
    described_class.call(account: account, enabled: true)
    result = described_class.call(account: account, enabled: false)
    expect(result.value.enabled).to be(false)
  end
end
