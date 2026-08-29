require "rails_helper"

RSpec.describe Sessions::Index do
  it "orders sessions by last_seen_at descending and keeps the current jti" do
    older = create(:session, last_seen_at: 2.minutes.ago)
    newer = create(:session, last_seen_at: 1.minute.ago)
    result = described_class.call(sessions: Session.where(id: [ older.id, newer.id ]), current_jti: newer.jti)

    expect(result.value.sessions).to eq([ newer, older ])
    expect(result.value.current_jti).to eq(newer.jti)
  end
end
