require "rails_helper"

RSpec.describe "Session 12.6 admin moderation 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on admin reports index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::ReportPolicy, :index?)
    get "/api/v1/admin/reports", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin reports show when the policy denies (F-1)" do
    admin = create(:user, :admin)
    report = create(:report)
    stub_deny(Admin::ReportPolicy, :show?)
    get "/api/v1/admin/reports/#{report.id}", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin report dismiss when the policy denies (F-1)" do
    admin = create(:user, :admin)
    report = create(:report)
    stub_deny(Admin::ReportPolicy, :dismiss?)
    post "/api/v1/admin/reports/#{report.id}/dismiss", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin report warn when the policy denies (F-1)" do
    admin = create(:user, :admin)
    report = create(:report)
    stub_deny(Admin::ReportPolicy, :warn?)
    post "/api/v1/admin/reports/#{report.id}/warn", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin report remove content when the policy denies (F-1)" do
    admin = create(:user, :admin)
    report = create(:report)
    stub_deny(Admin::ReportPolicy, :remove_content?)
    post "/api/v1/admin/reports/#{report.id}/remove_content", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin report deactivate when the policy denies (F-1)" do
    admin = create(:user, :admin)
    report = create(:report)
    stub_deny(Admin::ReportPolicy, :deactivate_account?)
    post "/api/v1/admin/reports/#{report.id}/deactivate_account", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin sticker packs index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::StickerPackPolicy, :index?)
    get "/api/v1/admin/sticker_packs", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin sticker packs create when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::StickerPackPolicy, :create?)
    post "/api/v1/admin/sticker_packs", headers: auth_headers_for(admin), as: :json,
         params: { name: "Waves", kind: "sticker" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin sticker packs update when the policy denies (F-1)" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    stub_deny(Admin::StickerPackPolicy, :update?)
    patch "/api/v1/admin/sticker_packs/#{pack.id}", headers: auth_headers_for(admin), as: :json,
          params: { published: true }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin sticker packs destroy when the policy denies (F-1)" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    stub_deny(Admin::StickerPackPolicy, :destroy?)
    delete "/api/v1/admin/sticker_packs/#{pack.id}", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin sticker packs reorder when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::StickerPackPolicy, :reorder?)
    patch "/api/v1/admin/sticker_packs/reorder", headers: auth_headers_for(admin), as: :json, params: { ids: [] }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin sticker create when the policy denies (F-1)" do
    admin = create(:user, :admin)
    pack = create(:sticker_pack, :system)
    stub_deny(Admin::StickerPackPolicy, :add_sticker?)
    post "/api/v1/admin/sticker_packs/#{pack.id}/stickers", headers: auth_headers_for(admin), as: :json,
         params: { signed_id: "x", shortcode: "wave" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin sticker destroy when the policy denies (F-1)" do
    admin = create(:user, :admin)
    sticker = create(:sticker, sticker_pack: create(:sticker_pack, :system))
    stub_deny(Admin::StickerPackPolicy, :destroy?)
    delete "/api/v1/admin/sticker_packs/#{sticker.sticker_pack_id}/stickers/#{sticker.id}",
           headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end
end
