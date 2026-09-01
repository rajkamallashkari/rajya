require "rails_helper"

RSpec.describe Admin::ReportPolicy do
  it "allows an admin and forbids a regular user" do
    report = create(:report)
    admin = create(:user, :admin)
    policy = described_class.new(admin, report)
    expect(policy).to be_index.and be_show.and be_dismiss.and be_warn.and be_remove_content.and be_deactivate_account
    member = described_class.new(create(:user), report)
    expect(member).not_to be_index
    expect(member).not_to be_dismiss
  end
end
