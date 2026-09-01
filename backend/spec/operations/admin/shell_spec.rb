require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes -- one file for session 12.5 admin operations
RSpec.describe Admin::Users::Index do
  it "lists users and rejects a non-admin" do
    admin = create(:user, :admin)
    member = create(:user, email: "find-me@example.com")

    ids = described_class.call(admin: admin, query: "find-me").value.users.map(&:id)
    expect(ids).to include(member.id)
    expect(described_class.call(admin: member).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::Users::Show do
  it "returns conversations for the subject and 404s a missing user" do
    admin = create(:user, :admin)
    target = create(:user)
    create_direct_between(target.account, create(:account))

    result = described_class.call(admin: admin, user: target)
    expect(result.value.conversations.length).to eq(1)
    expect(described_class.call(admin: admin, user: nil).error_code).to eq(:not_found)
    expect(described_class.call(admin: create(:user), user: target).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::Transcripts::Show do
  it "pages a transcript and audits the read" do
    admin = create(:user, :admin)
    conversation = create_direct_between(create(:account), create(:account))
    create(:message, conversation: conversation, sender_account: conversation.accounts.first, body: "<script>")

    page = described_class.call(admin: admin, conversation: conversation).value
    expect(page.messages.first.body).to eq("<script>")
    expect(AuditEvent.find_by!(action: "transcript.read").target_id).to eq(conversation.id)
  end

  it "rejects invalid cursors, a missing conversation, and a non-admin" do
    admin = create(:user, :admin)
    conversation = create_direct_between(create(:account), create(:account))

    expect(described_class.call(admin: admin, conversation: nil).error_code).to eq(:not_found)
    expect(described_class.call(admin: create(:user), conversation: conversation).error_code).to eq(:forbidden)
    expect(described_class.call(admin: admin, conversation: conversation, before: "x").error_code).to eq(:validation_failed)
    expect(described_class.call(admin: admin, conversation: conversation, before: 1, after: 2).error_code)
      .to eq(:validation_failed)
  end
end

RSpec.describe Admin::Impersonation::Start do
  it "issues a distinct token with both identities" do
    admin = create(:user, :admin)
    target = create(:user)
    issued = Auth::Session.issue(admin)
    session = admin.sessions.find_by!(jti: Auth::Token.decode(issued.token).fetch("jti"))

    token = described_class.call(admin: admin, account: target.account, session: session).value.token
    claims = Auth::Token.decode(token)
    expect(claims.fetch("impersonator_id").to_i).to eq(admin.id)
    expect(claims.fetch("account_id").to_i).to eq(target.account_id)
  end

  it "refuses missing inputs" do
    admin = create(:user, :admin)
    target = create(:user)
    issued = Auth::Session.issue(admin)
    session = admin.sessions.find_by!(jti: Auth::Token.decode(issued.token).fetch("jti"))

    expect(described_class.call(admin: create(:user), account: target.account, session: session).error_code)
      .to eq(:forbidden)
    expect(described_class.call(admin: admin, account: nil, session: session).error_code).to eq(:not_found)
    expect(described_class.call(admin: admin, account: target.account, session: nil).error_code).to eq(:unauthenticated)
  end
end

RSpec.describe Admin::Impersonation::Stop do
  it "audits the exit and refuses stopping without an impersonated account" do
    admin = create(:user, :admin)
    target = create(:user)

    expect(described_class.call(admin: admin, impersonated_account: target.account)).to be_success
    expect(AuditEvent.find_by!(action: "impersonation.stop").impersonated_account_id).to eq(target.account_id)
    expect(described_class.call(admin: admin, impersonated_account: admin.account).error_code).to eq(:validation_failed)
    expect(described_class.call(admin: create(:user), impersonated_account: target.account).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::AuditEvents::Index do
  it "filters by action and rejects a non-admin" do
    admin = create(:user, :admin)
    create(:audit_event, admin_user: admin, action: "phone.verified")
    create(:audit_event, admin_user: admin, action: "transcript.read")

    rows = described_class.call(admin: admin, action: "phone.verified").value.audit_events
    expect(rows.map(&:action)).to eq([ "phone.verified" ])
    expect(described_class.call(admin: create(:user)).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::Dashboards::Show do
  it "returns bucket health and rejects a non-admin" do
    admin = create(:user, :admin)
    create(:storage_bucket, service_name: "ops")
    create(:ai_usage_event, capability: "bot_reply", status: "success", prompt_tokens: 2, completion_tokens: 3)

    report = described_class.call(admin: admin).value
    expect(report.buckets.map(&:service_name)).to include("ops")
    expect(report.ai_usage.first.fetch("capability")).to eq("bot_reply")
    expect(described_class.call(admin: create(:user)).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::PromptTemplates::Index do
  it "lists registered capabilities and rejects a non-admin" do
    admin = create(:user, :admin)
    keys = described_class.call(admin: admin).value.prompt_templates.map { |row| row.fetch("capability") }

    expect(keys).to include("bot_reply")
    expect(described_class.call(admin: create(:user)).error_code).to eq(:forbidden)
  end
end

RSpec.describe Admin::PromptTemplates::Update do
  it "writes a new version that fetch reads without a restart" do
    admin = create(:user, :admin)
    result = described_class.call(admin: admin, capability: "bot_reply", template: "Be brief.")

    expect(result).to be_success
    expect(Ai::PromptTemplate.fetch(:bot_reply)).to eq("Be brief.")
    expect(AuditEvent.find_by!(action: "prompt_template.update")).to be_present
  end

  it "rejects unknown capabilities, blank templates, and non-admins" do
    admin = create(:user, :admin)
    expect(described_class.call(admin: admin, capability: "nope", template: "x").error_code).to eq(:validation_failed)
    expect(described_class.call(admin: admin, capability: "bot_reply", template: " ").error_code)
      .to eq(:validation_failed)
    expect(described_class.call(admin: create(:user), capability: "bot_reply", template: "x").error_code)
      .to eq(:forbidden)
  end
end
# rubocop:enable RSpec/MultipleDescribes
