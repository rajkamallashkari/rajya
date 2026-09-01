require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes -- Alba snapshots for the admin shell
RSpec.describe AdminUserListResource do
  it "serializes users" do
    user = create(:user)
    json = described_class.new(Admin::Users::List.new(users: [ user ])).to_h

    expect(json.fetch("users").first.fetch("id")).to eq(user.id)
    expect(json.fetch("users").first.fetch("account").fetch("username")).to eq(user.account.username)
  end
end

RSpec.describe AdminUserDetailResource do
  it "serializes the user and their conversations" do
    user = create(:user)
    talk = create_direct_between(user.account, create(:account))
    json = described_class.new(Admin::Users::Item.new(user: user, conversations: [ talk ])).to_h

    expect(json.fetch("user").fetch("id")).to eq(user.id)
    expect(json.fetch("conversations").first.fetch("id")).to eq(talk.id)
    expect(json.fetch("conversations").first.fetch("member_count")).to eq(2)
  end
end

RSpec.describe AdminAuditEventListResource do
  it "serializes events including an impersonated account" do
    admin = create(:user, :admin)
    account = create(:account)
    event = create(:audit_event, admin_user: admin, impersonated_account: account, action: "impersonation.start",
                   ip_address: "127.0.0.1")
    json = described_class.new(Admin::AuditEvents::List.new(audit_events: [ event ])).to_h
    row = json.fetch("audit_events").first

    expect(row.fetch("action")).to eq("impersonation.start")
    expect(row.fetch("impersonated_account").fetch("id")).to eq(account.id)
    expect(row.fetch("ip_address")).to eq("127.0.0.1")
  end
end

RSpec.describe AdminAuditEventResource do
  it "omits impersonated account and ip when they are blank" do
    event = create(:audit_event, action: "transcript.read")
    json = described_class.new(event).to_h

    expect(json.fetch("impersonated_account")).to be_nil
    expect(json.fetch("ip_address")).to be_nil
  end
end

RSpec.describe AdminDashboardResource do
  it "serializes buckets and rollups" do
    bucket = create(:storage_bucket, service_name: "ser")
    report = Admin::DashboardQuery::Report.new(
      buckets: [ bucket ],
      quotas: { "accounts" => 1 },
      ai_usage: [ { "capability" => "bot_reply", "status" => "success", "count" => 1 } ],
      jobs: { "ready" => 0 }
    )
    json = described_class.new(report).to_h

    expect(json.fetch("buckets").first.fetch("service_name")).to eq("ser")
    expect(json.fetch("quotas").fetch("accounts")).to eq(1)
    expect(json.fetch("jobs").fetch("ready")).to eq(0)
  end
end

RSpec.describe AdminPromptTemplateListResource do
  it "serializes the list" do
    json = described_class.new(Admin::PromptTemplates::List.new(prompt_templates: [ { "capability" => "bot_reply" } ])).to_h

    expect(json.fetch("prompt_templates").first.fetch("capability")).to eq("bot_reply")
  end
end

RSpec.describe AdminPromptTemplateResource do
  it "serializes one template" do
    json = described_class.new(Admin::PromptTemplates::Item.new(prompt_template: { "capability" => "bot_reply" })).to_h

    expect(json.fetch("prompt_template").fetch("capability")).to eq("bot_reply")
  end
end
# rubocop:enable RSpec/MultipleDescribes
