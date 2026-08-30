require "rails_helper"

RSpec.describe Folders::Create do
  it "creates a folder owned by the account" do
    account = create(:user).account
    result = described_class.call(account: account, name: " Work ")

    expect(result).to be_success
    expect(result.value).to have_attributes(name: "Work", position: 0, account_id: account.id)
  end

  it "appends position and rejects a blank or overlong name" do
    account = create(:user).account
    described_class.call(account: account, name: "A")
    second = described_class.call(account: account, name: "B")
    expect(second.value.position).to eq(1)

    expect(described_class.call(account: account, name: " ").error_code).to eq(:validation_failed)
    stub_setting(:folder_name_max_length, 2, category: "groups")
    expect(described_class.call(account: account, name: "too").error_code).to eq(:validation_failed)
  end

  it "rejects a missing account" do
    expect(described_class.call(account: nil, name: "Work").error_code).to eq(:forbidden)
  end
end
