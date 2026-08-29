require "rails_helper"

RSpec.describe Session do
  it "is usable when it is neither revoked nor expired" do
    expect(create(:session)).to be_usable
  end

  it "is not usable after revoke!" do
    session = create(:session)
    session.revoke!

    expect(session).to be_revoked
    expect(session).not_to be_usable
    expect(Auth::RevokedJtis).to be_blocked(session.jti)
  end

  it "is a no-op to revoke an already revoked session" do
    session = create(:session, :revoked)

    expect { session.revoke! }.not_to change { session.reload.revoked_at }
  end

  it "is not usable when expires_at is in the past" do
    expect(create(:session, :expired)).not_to be_usable
  end

  it "scopes active rows to unrevoked unexpired sessions" do
    live = create(:session)
    create(:session, :revoked)
    create(:session, :expired)

    expect(described_class.active).to contain_exactly(live)
  end

  it "revokes every session for a user except an optional jti" do
    user = create(:user)
    keep = create(:session, user: user)
    drop = create(:session, user: user)
    other = create(:session)

    described_class.revoke_all_for!(user, except_jti: keep.jti)

    expect(keep.reload).not_to be_revoked
    expect(drop.reload).to be_revoked
    expect(other.reload).not_to be_revoked
  end

  it "writes last_seen_at when it is blank" do
    session = create(:session)
    session.last_seen_at = nil
    session.touch_last_seen!

    expect(session.reload.last_seen_at).to be_within(1.second).of(Time.current)
  end

  it "skips last-seen writes inside the granularity window" do
    session = create(:session, last_seen_at: Time.current)
    session.touch_last_seen!

    expect(session.reload.last_seen_at).to be_within(1.second).of(Time.current)
  end

  it "writes last_seen_at when the granularity window has elapsed" do
    granularity = Settings.fetch(:session_last_seen_granularity)
    session = create(:session, last_seen_at: (granularity + 1).seconds.ago)
    session.touch_last_seen!

    expect(session.reload.last_seen_at).to be_within(1.second).of(Time.current)
  end
end
