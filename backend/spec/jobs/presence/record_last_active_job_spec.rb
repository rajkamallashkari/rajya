require "rails_helper"

RSpec.describe Presence::RecordLastActiveJob do
  include ActiveSupport::Testing::TimeHelpers
  it "delegates to RecordLastActive" do
    user = create(:user)
    freeze_time do
      described_class.perform_now(user.account.id)
      expect(user.reload.last_active_at).to eq(Time.current)
    end
  end
end
