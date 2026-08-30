require "rails_helper"

RSpec.describe SavedReplies::Create do
  it "creates a shortcut for the account" do
    account = create(:user).account
    result = described_class.call(account: account, shortcut: " /OMW ", body: " On my way ")

    expect(result.value.shortcut).to eq("/OMW")
    expect(result.value.body).to eq("On my way")
    expect(described_class.call(account: account, shortcut: "/later", body: "Later", position: nil).value.position)
      .to eq(0)
  end

  it "rejects a blank shortcut, duplicate shortcut, and oversize body" do
    account = create(:user).account
    expect(described_class.call(account: account, shortcut: " ", body: "Hi").error_code).to eq(:validation_failed)
    described_class.call(account: account, shortcut: "/omw", body: "A")
    expect(described_class.call(account: account, shortcut: "/OMW", body: "B").error_code).to eq(:validation_failed)
    stub_setting(:max_message_length, 3)
    expect(described_class.call(account: account, shortcut: "/x", body: "toolong").error_code).to eq(:validation_failed)
    stub_setting(:saved_reply_shortcut_max_length, 2)
    expect(described_class.call(account: account, shortcut: "/too", body: "Hi").error_code).to eq(:validation_failed)
  end

  it "rejects a missing account" do
    expect(described_class.call(account: nil, shortcut: "/omw", body: "Hi").error_code).to eq(:forbidden)
  end
end
