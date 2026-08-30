require "rails_helper"

RSpec.describe SavedReplies::Update do
  it "updates body and shortcut for the owner" do
    account = create(:user).account
    row = SavedReplies::Create.call(account: account, shortcut: "/omw", body: "A").value
    result = described_class.call(saved_reply: row, actor: account, body: "B", position: 2)

    expect(result.value.body).to eq("B")
    expect(result.value.position).to eq(2)
  end

  it "updates shortcut alone and treats a unique clash as validation_failed" do
    account = create(:user).account
    result = described_class.call(
      saved_reply: SavedReplies::Create.call(account: account, shortcut: "/a", body: "A").value,
      actor: account,
      shortcut: "/alpha"
    )
    expect(result).to be_success
    expect(result.value.shortcut).to eq("/alpha")
    row = SavedReplies::Create.call(account: account, shortcut: "/b", body: "B").value
    allow(row).to receive(:save!).and_raise(ActiveRecord::RecordNotUnique.new("dup"))
    expect(described_class.call(saved_reply: row, actor: account, shortcut: "/alpha").error_code)
      .to eq(:validation_failed)
  end

  it "forbids another account" do
    account = create(:user).account
    row = SavedReplies::Create.call(account: account, shortcut: "/omw", body: "A").value
    expect(described_class.call(saved_reply: row, actor: create(:user).account, body: "X").error_code)
      .to eq(:forbidden)
    expect(described_class.call(saved_reply: row, actor: account, body: "").error_code).to eq(:validation_failed)
  end
end
