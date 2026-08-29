require "rails_helper"

RSpec.describe Auth::RevokedJtis do
  it "reports a jti as blocked after it is added" do
    jti = SecureRandom.uuid
    create(:session, :revoked, jti: jti)

    described_class.add(jti)

    expect(described_class).to be_blocked(jti)
  end

  it "does not treat an unknown jti as blocked when the cache can be read" do
    expect(described_class.blocked?(SecureRandom.uuid)).to be(false)
  end

  it "treats a blank jti as blocked" do
    expect(described_class.blocked?(nil)).to be(true)
    expect(described_class.blocked?("")).to be(true)
  end

  it "fails closed when the cache cannot be read" do
    allow(described_class).to receive(:read_set).and_raise(Redis::BaseError, "down")

    expect(described_class.blocked?(SecureRandom.uuid)).to be(true)
  end

  it "rebuilds the set from revoked session rows on a cache miss" do
    jti = create(:session, :revoked).jti

    expect(described_class).to be_blocked(jti)
  end

  it "no-ops when given an empty list" do
    expect(described_class.add([])).to be_nil
  end

  it "invalidates a cold cache so the next read rebuilds from the database" do
    jti = create(:session, :revoked).jti
    described_class.add(jti)

    expect(described_class).to be_blocked(jti)
  end

  it "writes through when the set is already cached" do
    described_class.read_set
    jti = SecureRandom.uuid
    described_class.add(jti)

    expect(described_class).to be_blocked(jti)
  end

  it "invalidates the cache when the write path errors" do
    allow(Rails.cache).to receive(:read).and_raise(Redis::BaseError, "down")
    allow(Rails.cache).to receive(:delete).and_call_original

    described_class.add(SecureRandom.uuid)

    expect(Rails.cache).to have_received(:delete).with(described_class::CACHE_KEY)
  end

  it "invalidates the cache when writing the merged set fails" do
    described_class.read_set
    allow(Rails.cache).to receive(:write).and_raise(Redis::BaseError, "down")
    allow(Rails.cache).to receive(:delete).and_call_original

    described_class.add(SecureRandom.uuid)

    expect(Rails.cache).to have_received(:delete).with(described_class::CACHE_KEY)
  end
end
