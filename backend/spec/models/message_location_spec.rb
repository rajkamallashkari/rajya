require "rails_helper"

RSpec.describe MessageLocation do
  it "rejects a latitude or longitude outside the configured bounds" do
    point = build(:message_location, latitude: Settings.fetch(:latitude_max) + 1)
    expect(point).not_to be_valid
    expect(point.errors[:latitude]).to be_present

    other = build(:message_location, longitude: Settings.fetch(:longitude_min) - 1)
    expect(other).not_to be_valid
    expect(other.errors[:longitude]).to be_present
  end

  it "accepts a point inside the bounds" do
    point = create(:message_location)
    expect(point).to be_valid
    expect(point.created_at).to be_present
  end

  it "skips range checks when a coordinate is blank" do
    missing_lat = build(:message_location, latitude: nil)
    missing_lng = build(:message_location, longitude: nil)

    expect(missing_lat).not_to be_valid
    expect(missing_lng).not_to be_valid
    expect(missing_lat.errors[:latitude]).to be_present
    expect(missing_lng.errors[:longitude]).to be_present
  end
end
