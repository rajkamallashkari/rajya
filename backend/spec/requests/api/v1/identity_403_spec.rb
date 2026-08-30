require "rails_helper"

RSpec.describe "Session 2.4 authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on profile show when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(UsersPolicy, :show?)
    get "/api/v1/users/me", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on profile update when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(UsersPolicy, :update?)
    patch "/api/v1/users/me", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on account deactivation when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(UsersPolicy, :destroy?)
    delete "/api/v1/users/me", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on complete onboarding when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(UsersPolicy, :complete_onboarding?)
    post "/api/v1/users/me/complete_onboarding", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on email change when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(UsersPolicy, :change_email?)
    post "/api/v1/users/me/email/change", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on email verify when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(UsersPolicy, :verify_email?)
    post "/api/v1/users/me/email/verify", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on phone verification issue when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PhoneVerificationPolicy, :create?)
    post "/api/v1/users/me/phone/verification", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on phone verification status when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(PhoneVerificationPolicy, :show?)
    get "/api/v1/users/me/phone/verification", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on username check when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(UsernamePolicy, :show?)
    get "/api/v1/accounts/username", headers: auth_headers_for(user), params: { username: "ada" }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on account profile when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(AccountPolicy, :show?)
    get "/api/v1/accounts/#{create(:account).id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on block index when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(BlockPolicy, :index?)
    get "/api/v1/blocks", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on block create when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(BlockPolicy, :create?)
    post "/api/v1/blocks", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on block destroy when the policy denies (F-1)" do
    user = create(:user)
    target = create(:account)
    create(:block, blocker_account: user.account, blocked_account: target)
    stub_deny(BlockPolicy, :destroy?)
    delete "/api/v1/blocks/#{target.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on session index when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(SessionPolicy, :index?)
    get "/api/v1/sessions", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on session destroy when the policy denies (F-1)" do
    user = create(:user)
    session = create(:session, user: user)
    stub_deny(SessionPolicy, :destroy?)
    delete "/api/v1/sessions/#{session.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on session revoke-others when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(SessionPolicy, :others?)
    delete "/api/v1/sessions/others", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on nickname index when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(ContactNicknamePolicy, :index?)
    get "/api/v1/contact_nicknames", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on nickname upsert when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(ContactNicknamePolicy, :update?)
    put "/api/v1/contact_nicknames/#{create(:account).id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on nickname destroy when the policy denies (F-1)" do
    user = create(:user)
    target = create(:account)
    create(:contact_nickname, owner_account: user.account, target_account: target)
    stub_deny(ContactNicknamePolicy, :destroy?)
    delete "/api/v1/contact_nicknames/#{target.id}", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on report create when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(ReportPolicy, :create?)
    post "/api/v1/reports", headers: auth_headers_for(user),
         params: { subject_type: "account", subject_id: create(:account).id, reason: "spam" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on report reasons when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(ReportPolicy, :reasons?)
    get "/api/v1/reports/reasons", headers: auth_headers_for(user)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin phone verify when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::UserPolicy, :verify_phone?)
    post "/api/v1/admin/users/#{create(:user).id}/verify_phone", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end
end
