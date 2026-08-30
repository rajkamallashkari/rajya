require "rails_helper"

RSpec.describe ConversationFolderPolicy do
  it "allows the owner to update and destroy" do
    user = create(:user)
    folder = create(:conversation_folder, account: user.account)
    policy = described_class.new(user.account, folder)
    expect(policy).to be_update.and be_destroy
    expect(described_class.new(user.account, ConversationFolder)).to be_index.and be_create.and be_reorder
  end

  it "denies another account and scopes to the owner" do
    user = create(:user)
    folder = create(:conversation_folder, account: user.account)
    expect(described_class.new(create(:user).account, folder)).not_to be_update
    expect(described_class::Scope.new(user.account, ConversationFolder.all).resolve).to contain_exactly(folder)
    expect(described_class::Scope.new(nil, ConversationFolder.all).resolve).to be_empty
  end

  it "denies update on a class record" do
    folder = create(:conversation_folder)
    expect(described_class.new(create(:user).account, ConversationFolder)).not_to be_update
    expect(described_class.new(nil, folder)).not_to be_update
  end
end
