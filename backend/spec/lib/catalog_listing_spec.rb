require "rails_helper"

RSpec.describe Catalog do
  describe Catalog::Flat do
    it "flattens nested hashes into dotted keys" do
      expect(described_class.from_hash({ "errors" => { "not_found" => "Gone" } })).to eq("errors.not_found" => "Gone")
    end
  end

  describe ".listing" do
    it "marks admin overrides" do
      admin = create(:user, :admin)
      TranslationString.create!(key: "errors.not_found", locale: "en", value: "Gone.", updated_by_user: admin)

      row = described_class.listing(locale: "en").find { |entry| entry.fetch("key") == "errors.not_found" }

      expect(row.fetch("overridden")).to be(true)
      expect(row.fetch("value")).to eq("Gone.")
    end

    it "filters by query text" do
      keys = described_class.listing(locale: "en", query: "not_found").map { |entry| entry.fetch("key") }

      expect(keys).to include("errors.not_found")
    end
  end
end
