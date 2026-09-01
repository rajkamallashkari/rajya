require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes, RSpec/ExampleLength, RSpec/MultipleExpectations -- session 12.6 admin system packs
RSpec.describe Admin::StickerPacks::Index do
  it "lists unpublished system packs and hides user packs" do
    admin = create(:user, :admin)
    system_pack = create(:sticker_pack, :system)
    create(:sticker_pack)

    ids = described_class.call(admin: admin).value.sticker_packs.map(&:id)
    expect(ids).to eq([ system_pack.id ])
    expect(described_class.call(admin: create(:user)).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::StickerPacks::Create do
  it "creates a system pack for an admin" do
    admin = create(:user, :admin)
    pack = described_class.call(admin: admin, name: "Waves", kind: "sticker").value
    expect(pack).to be_system
    expect(described_class.call(admin: create(:user), name: "Waves", kind: "sticker").error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::StickerPacks::Update do
  it "publishes a system pack and 404s a user pack" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    expect(described_class.call(admin: admin, pack: pack, published: true).value).to be_published
    expect(described_class.call(admin: admin, pack: create(:sticker_pack)).error_code).to eq(:not_found)
    expect(described_class.call(admin: admin, pack: nil).error_code).to eq(:not_found)
    expect(described_class.call(admin: create(:user), pack: pack).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::StickerPacks::Destroy do
  it "destroys a system pack" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    expect(described_class.call(admin: admin, pack: pack)).to be_success
    expect(StickerPack.where(id: pack.id)).not_to exist
    expect(described_class.call(admin: admin, pack: create(:sticker_pack)).error_code).to eq(:not_found)
    expect(described_class.call(admin: admin, pack: nil).error_code).to eq(:not_found)
    expect(described_class.call(admin: create(:user), pack: pack).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::StickerPacks::Reorder do
  it "delegates reorder and forbids a member" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    expect(described_class.call(admin: admin, ids: [ pack.id ]).value.sticker_packs.map(&:id)).to eq([ pack.id ])
    expect(described_class.call(admin: create(:user), ids: [ pack.id ]).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::StickerPacks::AddSticker do
  it "adds to a system pack and 404s a user pack" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    create(:storage_bucket, service_name: "test")
    blob = ActiveStorage::Blob.create_and_upload!(io: StringIO.new("img"), filename: "s.png", content_type: "image/png")
    expect(
      described_class.call(admin: admin, pack: pack, signed_id: blob.signed_id, shortcode: "wave")
    ).to be_success
    expect(
      described_class.call(admin: admin, pack: create(:sticker_pack), signed_id: blob.signed_id, shortcode: "x")
        .error_code
    ).to eq(:not_found)
    expect(
      described_class.call(admin: admin, pack: nil, signed_id: blob.signed_id, shortcode: "x").error_code
    ).to eq(:not_found)
    expect(
      described_class.call(admin: create(:user), pack: pack, signed_id: blob.signed_id, shortcode: "x").error_code
    ).to eq(:forbidden)
  end
end

RSpec.describe Admin::StickerPacks::RemoveSticker do
  it "removes a system sticker" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    sticker = create(:sticker, sticker_pack: pack)
    expect(described_class.call(admin: admin, sticker: sticker)).to be_success
    expect(described_class.call(admin: admin, sticker: create(:sticker)).error_code).to eq(:not_found)
    expect(described_class.call(admin: admin, sticker: nil).error_code).to eq(:not_found)
    expect(described_class.call(admin: create(:user), sticker: sticker).error_code).to eq(:forbidden)
  end
end
# rubocop:enable RSpec/MultipleDescribes, RSpec/ExampleLength, RSpec/MultipleExpectations
