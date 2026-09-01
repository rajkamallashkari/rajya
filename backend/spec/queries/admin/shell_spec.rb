require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes -- one file for session 12.5 admin queries
RSpec.describe Admin::UsersQuery do
  it "searches by email and username" do
    match = create(:user, email: "needle@example.com")
    create(:user, email: "other@example.com")

    expect(described_class.call(query: "needle").map(&:id)).to eq([ match.id ])
  end

  context "when measuring N+1", :n_plus_one do
    populate { |count| count.times { create(:user) } }

    it "does not grow queries as the user list grows" do
      ::Settings.fetch(:search_page_size)
      expect do
        AdminUserListResource.new(Admin::Users::List.new(users: described_class.call)).to_h
      end.to perform_constant_number_of_queries
    end
  end
end

RSpec.describe Admin::ConversationsQuery do
  it "lists conversations for the subject account" do
    user = create(:user)
    talk = create_direct_between(user.account, create(:account))
    create_direct_between(create(:account), create(:account))

    expect(described_class.call(account: user.account).map(&:id)).to eq([ talk.id ])
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      count.times { create_talk(kind: "group", owner: owner.account, members: [ create(:account) ]) }
      holder[:account] = owner.account
    end

    it "does not grow queries as memberships grow" do
      ::Settings.fetch(:search_page_size)
      expect do
        rows = described_class.call(account: holder.fetch(:account))
        rows.each { |row| AdminConversationResource.new(row).to_h }
      end.to perform_constant_number_of_queries
    end
  end
end

RSpec.describe Admin::AuditEventsQuery do
  it "filters by admin, impersonated account, and action" do
    admin = create(:user, :admin)
    other = create(:user, :admin)
    account = create(:account)
    match = create(:audit_event, admin_user: admin, impersonated_account: account, action: "impersonation.start")
    create(:audit_event, admin_user: other, action: "transcript.read")

    expect(described_class.call(admin_user_id: admin.id, impersonated_account_id: account.id,
                                action: "impersonation.start").map(&:id)).to eq([ match.id ])
    expect(described_class.call.map(&:id)).to include(match.id)
  end
end

RSpec.describe Admin::DashboardQuery do
  it "rolls up buckets, quotas, usage, and jobs" do
    create(:storage_bucket, service_name: "q", used_bytes: 4, capacity_bytes: 10)
    create(:storage_quota, used_bytes: 4, quota_bytes: 10)
    create(:ai_usage_event, capability: "rewrite", status: "failed", prompt_tokens: 1, completion_tokens: 0)

    report = described_class.call
    expect(report.buckets.first.service_name).to eq("q")
    expect(report.quotas.fetch("used_bytes")).to eq(4)
    expect(report.ai_usage.first.fetch("status")).to eq("failed")
    expect(report.jobs).to include("ready", "failed", "processes")
  end
end
# rubocop:enable RSpec/MultipleDescribes
