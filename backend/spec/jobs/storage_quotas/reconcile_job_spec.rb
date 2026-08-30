require "rails_helper"

RSpec.describe StorageQuotas::ReconcileJob do
  it "delegates to Reconcile for one account and for every account" do
    allow(StorageQuotas::Reconcile).to receive(:call).and_return(Result.success(true))
    account = create(:account)

    described_class.perform_now(account.id)
    described_class.perform_now

    expect(StorageQuotas::Reconcile).to have_received(:call).with(account: account)
    expect(StorageQuotas::Reconcile).to have_received(:call).with(account: nil)
  end
end
