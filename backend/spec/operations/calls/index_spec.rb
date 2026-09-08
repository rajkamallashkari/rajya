require "rails_helper"

RSpec.describe Calls::Index do
  it "returns only this account's calls" do
    enable_webrtc_calls!
    user = create(:user)
    mine = create_direct_call_log(user.account)
    create_direct_call_log(create(:user).account)

    page = described_class.call(
      account: user.account, calls: CallPolicy::Scope.new(user.account, Call.all).resolve
    ).value

    expect(page.calls.map(&:call)).to contain_exactly(mine)
  end

  it "pages newest-first" do
    enable_webrtc_calls!
    user = create(:user)
    AppSetting.create!(key: "call_page_size", value: 1, category: "calls")
    newer = create_direct_call_log(user.account)
    create_direct_call_log(user.account, created_at: 1.hour.ago)

    first = described_class.call(
      account: user.account, calls: CallPolicy::Scope.new(user.account, Call.all).resolve, page: 1
    ).value

    expect(first.calls.map(&:call)).to eq([ newer ])
    expect(first.has_more).to be(true)
  end

  it "rejects a missing webrtc flag" do
    user = create(:user)
    expect(
      described_class.call(account: user.account, calls: Call.none).error_code
    ).to eq(:not_found)
  end
end
