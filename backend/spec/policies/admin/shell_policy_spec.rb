require "rails_helper"

# rubocop:disable RSpec/MultipleDescribes -- session 12.5 admin policies
RSpec.describe Admin::UserPolicy do
  it "allows an admin and forbids a regular user" do
    target = create(:user)
    admin = described_class.new(create(:user, :admin), target)
    member = described_class.new(create(:user), target)
    expect(admin).to be_verify_phone.and be_index.and be_show.and be_impersonate
    expect(member).not_to be_index
  end
end

RSpec.describe Admin::TranscriptPolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), Conversation)).to be_show
    expect(described_class.new(create(:user), Conversation)).not_to be_show
  end
end

RSpec.describe Admin::ImpersonationPolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), :impersonation)).to be_create.and be_destroy
    expect(described_class.new(create(:user), :impersonation)).not_to be_create
  end
end

RSpec.describe Admin::AuditEventPolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), AuditEvent)).to be_index
    expect(described_class.new(create(:user), AuditEvent)).not_to be_index
  end
end

RSpec.describe Admin::DashboardPolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), :dashboard)).to be_show
    expect(described_class.new(create(:user), :dashboard)).not_to be_show
  end
end

RSpec.describe Admin::PromptTemplatePolicy do
  it "allows an admin and forbids a regular user" do
    expect(described_class.new(create(:user, :admin), :prompt_template)).to be_index.and be_update
    expect(described_class.new(create(:user), :prompt_template)).not_to be_update
  end
end
# rubocop:enable RSpec/MultipleDescribes
