require "rails_helper"

RSpec.describe Admin::ReportsQuery do
  it "filters by status, subject type, and a rolling age window" do
    match = create(:report, reason: "spam")
    create(:report, :dismissed)
    create(:report, subject_type: "bot", subject_id: create(:bot).id)
    old = create(:report, created_at: 3.days.ago)

    expect(described_class.call(status: "pending", subject_type: "account").map(&:id)).to include(match.id)
    expect(described_class.call(status: "dismissed").map(&:id)).not_to include(match.id)
    expect(described_class.call(max_age_hours: 1).map(&:id)).not_to include(old.id)
    expect(described_class.call(max_age_hours: "nope").map(&:id)).to include(match.id)
  end

  context "when measuring N+1", :n_plus_one do
    populate { |count| count.times { create(:report) } }

    it "does not grow queries as the inbox grows" do
      ::Settings.fetch(:search_page_size)
      expect { described_class.call }.to perform_constant_number_of_queries
    end
  end
end
