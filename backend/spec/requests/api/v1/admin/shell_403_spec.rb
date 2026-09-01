require "rails_helper"

RSpec.describe "Session 12.5 admin shell 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on admin users index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::UserPolicy, :index?)
    get "/api/v1/admin/users", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin users show when the policy denies (F-1)" do
    admin = create(:user, :admin)
    target = create(:user)
    stub_deny(Admin::UserPolicy, :show?)
    get "/api/v1/admin/users/#{target.id}", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on admin transcript index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    conversation = create_direct_between(create(:account), create(:account))
    stub_deny(Admin::TranscriptPolicy, :show?)
    get "/api/v1/admin/conversations/#{conversation.id}/messages", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on impersonation start when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::ImpersonationPolicy, :create?)
    post "/api/v1/admin/impersonation", headers: auth_headers_for(admin), as: :json,
         params: { account_id: create(:user).account_id }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on impersonation stop when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::ImpersonationPolicy, :destroy?)
    delete "/api/v1/admin/impersonation", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on audit events index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::AuditEventPolicy, :index?)
    get "/api/v1/admin/audit_events", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on dashboard show when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::DashboardPolicy, :show?)
    get "/api/v1/admin/dashboard", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on prompt templates index when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::PromptTemplatePolicy, :index?)
    get "/api/v1/admin/prompt_templates", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on prompt templates update when the policy denies (F-1)" do
    admin = create(:user, :admin)
    stub_deny(Admin::PromptTemplatePolicy, :update?)
    patch "/api/v1/admin/prompt_templates", headers: auth_headers_for(admin), as: :json,
          params: { capability: "bot_reply", template: "Hi" }
    expect(response).to have_http_status(:forbidden)
  end
end
