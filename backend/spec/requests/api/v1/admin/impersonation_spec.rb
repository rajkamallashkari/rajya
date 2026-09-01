require "rails_helper"

RSpec.describe "Admin impersonation (NR-7 / D-2)", type: :request do
  it "permits a destructive unsend while impersonating and writes both identities first" do
    admin = create(:user, :admin)
    target = create(:user)
    peer = create(:account)
    conversation = create_direct_between(target.account, peer)
    message = create(:message, conversation: conversation, sender_account: target.account, body: "secret")
    headers = impersonation_headers_for(admin, target.account)

    delete "/api/v1/messages/#{message.id}", headers: headers

    expect(response).to have_http_status(:ok)
    expect(message.reload).to be_deleted
    event = AuditEvent.find_by(action: "api/v1/messages#destroy")
    expect(event.admin_user_id).to eq(admin.id)
    expect(event.impersonated_account_id).to eq(target.account_id)
  end

  it "keeps the audit row when an impersonated write raises" do
    admin = create(:user, :admin)
    target = create(:user)
    peer = create(:account)
    conversation = create_direct_between(target.account, peer)
    message = create(:message, conversation: conversation, sender_account: target.account)
    headers = impersonation_headers_for(admin, target.account)
    allow(Messages::Unsend).to receive(:call).and_raise(RuntimeError, "boom")

    expect do
      delete "/api/v1/messages/#{message.id}", headers: headers
    end.to raise_error(RuntimeError, "boom")
    expect(AuditEvent.find_by(action: "api/v1/messages#destroy")).to be_present
  end

  it "logs both identities on every impersonated request" do
    admin = create(:user, :admin)
    target = create(:user)
    allow(Rails.logger).to receive(:info).and_call_original
    get "/api/v1/users/me", headers: impersonation_headers_for(admin, target.account)

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body.dig("impersonation", "account_id")).to eq(target.account_id)
    expect(body.dig("user", "id")).to eq(admin.id)
    expect(Rails.logger).to have_received(:info).with(a_string_including("\"impersonator_id\":#{admin.id}"))
  end

  it "rejects stop when the session is not impersonating" do
    admin = create(:user, :admin)
    delete "/api/v1/admin/impersonation", headers: auth_headers_for(admin)
    expect(response).to have_http_status(:unprocessable_content)
  end
end
