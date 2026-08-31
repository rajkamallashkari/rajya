require "rails_helper"

RSpec.describe PreferenceResource do
  it "serializes the materialized document and timestamp" do
    view = PreferenceDocuments::View.new(
      data: { "appearance" => { "theme" => "dark" } },
      updated_at: Time.utc(2026, 8, 31, 12, 0, 0)
    )

    expect(described_class.new(view).to_h).to include(
      "data" => { "appearance" => { "theme" => "dark" } },
      "updated_at" => "2026-08-31T12:00:00Z"
    )
  end

  it "serializes a nil timestamp" do
    view = PreferenceDocuments::View.new(data: {}, updated_at: nil)

    expect(described_class.new(view).to_h.fetch("updated_at")).to be_nil
  end
end
