require "rails_helper"

RSpec.describe Folders::Update do
  it "renames a folder owned by the actor" do
    account = create(:user).account
    folder = Folders::Create.call(account: account, name: "Work").value
    result = described_class.call(folder: folder, actor: account, name: " Home ")

    expect(result.value.name).to eq("Home")
  end

  it "updates position for a folder owned by the actor" do
    account = create(:user).account
    folder = Folders::Create.call(account: account, name: "Work").value
    result = described_class.call(folder: folder, actor: account, position: 3)

    expect(result.value.position).to eq(3)
  end

  it "forbids another account and rejects a blank name" do
    folder = Folders::Create.call(account: create(:user).account, name: "Work").value
    expect(described_class.call(folder: folder, actor: create(:user).account, name: "X").error_code)
      .to eq(:forbidden)
    expect(described_class.call(folder: folder, actor: folder.account, name: " ").error_code)
      .to eq(:validation_failed)
  end
end
