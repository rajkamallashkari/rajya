require "rails_helper"

RSpec.describe "Session 7.1 media authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on direct upload when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(DirectUploadPolicy, :create?)
    post "/api/v1/direct_uploads", headers: auth_headers_for(user), as: :json, params: {
      filename: "pic.png", byte_size: 4, checksum: Digest::MD5.base64digest("data"), content_type: "image/png"
    }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on thumbnail when the viewer is not a member (BR-94)" do
    owner = create(:user)
    stranger = create(:user)
    conversation = create_direct_between(owner.account, create(:account))
    attachment = create(:attachment, message: create(:message, conversation: conversation, sender_account: owner.account))
    attachment.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")

    get "/api/v1/attachments/#{attachment.id}/thumbnail", headers: auth_headers_for(stranger)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when sticker pack index is denied" do
    user = create(:user)
    stub_deny(StickerPackPolicy, :index?)
    get "/api/v1/sticker_packs", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when sticker pack create is denied" do
    user = create(:user)
    stub_deny(StickerPackPolicy, :create?)
    post "/api/v1/sticker_packs", headers: auth_headers_for(user),
         params: { name: "Waves", kind: "sticker" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when sticker pack update is denied" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    stub_deny(StickerPackPolicy, :update?)
    patch "/api/v1/sticker_packs/#{pack.id}", headers: auth_headers_for(user),
          params: { name: "X" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when sticker pack destroy is denied" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    stub_deny(StickerPackPolicy, :destroy?)
    delete "/api/v1/sticker_packs/#{pack.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when adding a sticker is denied" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    stub_deny(StickerPackPolicy, :add_sticker?)
    post "/api/v1/sticker_packs/#{pack.id}/stickers", headers: auth_headers_for(user),
         params: { signed_id: "x", shortcode: "wave" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when removing a sticker is denied" do
    user = create(:user)
    pack = create(:sticker_pack, owner_account: user.account)
    sticker = create(:sticker, sticker_pack: pack)
    stub_deny(StickerPolicy, :destroy?)
    delete "/api/v1/sticker_packs/#{pack.id}/stickers/#{sticker.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 when GIF search is denied" do
    user = create(:user)
    stub_deny(GifSearchPolicy, :index?)
    get "/api/v1/gifs", headers: auth_headers_for(user), params: { q: "party" }
    expect(response).to have_http_status(:forbidden)
  end
end
