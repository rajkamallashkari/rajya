require "rails_helper"

RSpec.describe Admin::StickerPackPolicy do
  it "allows an admin and forbids a regular user" do
    pack = create(:sticker_pack, :system)
    admin = described_class.new(create(:user, :admin), pack)
    expect(admin).to be_index.and be_create.and be_update.and be_destroy.and be_reorder.and be_add_sticker
    member = described_class.new(create(:user), pack)
    expect(member).not_to be_create
    expect(member).not_to be_reorder
  end
end
