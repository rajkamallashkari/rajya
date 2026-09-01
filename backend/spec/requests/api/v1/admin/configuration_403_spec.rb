require "rails_helper"

RSpec.describe "Session 12.4 admin configuration 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on admin settings index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::AppSettingPolicy, :index?)
    get "/api/v1/admin/settings", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin settings update when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::AppSettingPolicy, :update?)
    patch "/api/v1/admin/settings", headers: auth_headers_for(admin), as: :json,
          params: { key: "message_edit_window", value: 120 }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin settings destroy when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::AppSettingPolicy, :destroy?)
    delete "/api/v1/admin/settings", headers: auth_headers_for(admin), params: { key: "message_edit_window" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin feature flags index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::FeatureFlagPolicy, :index?)
    get "/api/v1/admin/feature_flags", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin feature flags update when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::FeatureFlagPolicy, :update?)
    patch "/api/v1/admin/feature_flags", headers: auth_headers_for(admin), as: :json,
          params: { key: "webrtc_calls", enabled: true }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin translation strings index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::TranslationStringPolicy, :index?)
    get "/api/v1/admin/translation_strings", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin translation strings update when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::TranslationStringPolicy, :update?)
    patch "/api/v1/admin/translation_strings", headers: auth_headers_for(admin), as: :json,
          params: { key: "errors.not_found", value: "X" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin translation strings destroy when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::TranslationStringPolicy, :destroy?)
    delete "/api/v1/admin/translation_strings", headers: auth_headers_for(admin), params: { key: "errors.not_found" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin theme overrides index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::ThemeOverridePolicy, :index?)
    get "/api/v1/admin/theme_overrides", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin theme overrides update when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::ThemeOverridePolicy, :update?)
    patch "/api/v1/admin/theme_overrides", headers: auth_headers_for(admin), as: :json,
          params: { theme: "light", token_name: "--accent", value: "#4F46E5" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin theme overrides destroy when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::ThemeOverridePolicy, :destroy?)
    delete "/api/v1/admin/theme_overrides", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on theme override palettes when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(ThemeOverridePolicy, :show?)
    get "/api/v1/theme_overrides", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end
end
