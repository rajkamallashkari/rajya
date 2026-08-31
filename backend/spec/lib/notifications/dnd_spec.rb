require "rails_helper"

RSpec.describe Notifications::Dnd do
  def settings(overrides = {})
    Settings.fetch(:notification_cascade_defaults).merge("dnd_enabled" => true).merge(overrides)
  end

  def active?(overrides = {}, timezone: "UTC", at:)
    described_class.active?(settings: settings(overrides), timezone: timezone, at: at)
  end

  it "is inactive when DND is disabled" do
    at = Time.utc(2026, 1, 12, 17, 0, 0)
    expect(described_class.active?(settings: settings("dnd_enabled" => false), timezone: "UTC", at: at)).to be(false)
  end

  it "evaluates the window in the account timezone rather than the server's (F-21)" do
    Time.use_zone("UTC") do
      # 17:00 UTC == 22:30 IST on Monday 12 Jan 2026.
      at = Time.utc(2026, 1, 12, 17, 0, 0)
      expect(active?(timezone: "Asia/Kolkata", at: at)).to be(true)
      expect(active?(timezone: "UTC", at: at)).to be(false)
    end
  end

  it "keeps an overnight window on the start day across midnight (F-21)" do
    Time.use_zone("UTC") do
      still_in = Time.utc(2026, 1, 13, 1, 0, 0) # Tuesday 06:30 IST, window started Monday 22:00 IST
      after_end = Time.utc(2026, 1, 13, 2, 30, 0) # Tuesday 08:00 IST
      expect(active?({ "dnd_days" => [ 1 ] }, timezone: "Asia/Kolkata", at: still_in)).to be(true)
      expect(active?({ "dnd_days" => [ 1 ] }, timezone: "Asia/Kolkata", at: after_end)).to be(false)
    end
  end

  it "allows a same-day window only on selected days and inside the range" do
    overrides = { "dnd_start" => "08:00", "dnd_end" => "17:00", "dnd_days" => [ 1 ] }
    monday_noon = Time.utc(2026, 1, 12, 12, 0, 0)
    monday_morning = Time.utc(2026, 1, 12, 7, 0, 0)
    monday_evening = Time.utc(2026, 1, 12, 18, 0, 0)
    sunday_noon = Time.utc(2026, 1, 11, 12, 0, 0)
    expect(active?(overrides, at: monday_noon)).to be(true)
    expect(active?(overrides, at: monday_morning)).to be(false)
    expect(active?(overrides, at: monday_evening)).to be(false)
    expect(active?(overrides, at: sunday_noon)).to be(false)
  end

  it "is inactive in the daytime gap of an overnight window" do
    expect(active?(at: Time.utc(2026, 1, 12, 12, 0, 0))).to be(false)
  end

  it "skips the evening portion when today is not a DND day" do
    expect(active?({ "dnd_days" => [ 1 ] }, at: Time.utc(2026, 1, 11, 23, 0, 0))).to be(false)
  end

  it "does not extend overnight DND into a morning whose start day is unselected" do
    expect(active?({ "dnd_days" => [ 1 ] }, at: Time.utc(2026, 1, 12, 6, 0, 0))).to be(false)
  end

  it "is inactive when start or end cannot be parsed" do
    at = Time.utc(2026, 1, 12, 23, 0, 0)
    expect(active?({ "dnd_start" => "nope" }, at: at)).to be(false)
    expect(active?({ "dnd_end" => "22:xx" }, at: at)).to be(false)
    expect(active?({ "dnd_start" => "22:" }, at: at)).to be(false)
  end

  it "falls back to UTC for a blank or unknown timezone" do
    at = Time.utc(2026, 1, 12, 23, 0, 0)
    expect(active?(timezone: "", at: at)).to be(true)
    expect(active?(timezone: "Not/AZone", at: at)).to be(true)
  end

  it "coerces string dnd_days" do
    at = Time.utc(2026, 1, 12, 23, 0, 0)
    expect(active?({ "dnd_days" => %w[1] }, at: at)).to be(true)
  end
end
