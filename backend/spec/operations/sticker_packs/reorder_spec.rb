require "rails_helper"

RSpec.describe StickerPacks::Reorder do
  it "reorders system packs for an admin" do
    admin = create(:user, :admin)
    first = create(:sticker_pack, :system, position: 0)
    second = create(:sticker_pack, :system, position: 1)

    result = described_class.call(actor: admin.account, ids: [ second.id, first.id ])

    expect(result.value.sticker_packs.map(&:id)).to eq([ second.id, first.id ])
    expect(second.reload.position).to eq(0)
    expect(first.reload.position).to eq(1)
  end

  it "rejects a member, a missing actor, and a mismatched id list" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    expect(described_class.call(actor: create(:user).account, ids: [ pack.id ]).error_code).to eq(:forbidden)
    expect(described_class.call(actor: nil, ids: [ pack.id ]).error_code).to eq(:forbidden)
    expect(described_class.call(actor: admin.account, ids: [ pack.id, 0 ]).error_code).to eq(:validation_failed)
  end
end
