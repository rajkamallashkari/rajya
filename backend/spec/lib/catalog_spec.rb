require "rails_helper"

RSpec.describe Catalog do
  describe ".t" do
    it "returns the locale-file default when no DB row exists" do
      expect(described_class.t("errors.not_found")).to eq("The requested resource could not be found.")
    end

    it "returns the DB override without a restart" do
      TranslationString.create!(key: "errors.not_found", locale: "en", value: "Nope.")

      expect(described_class.t("errors.not_found")).to eq("Nope.")
    end

    it "invalidates the cache when the row is updated" do
      row = TranslationString.create!(key: "errors.not_found", locale: "en", value: "Nope.")
      expect(described_class.t("errors.not_found")).to eq("Nope.")

      row.update!(value: "Still no.")

      expect(described_class.t("errors.not_found")).to eq("Still no.")
    end

    it "falls back to the key itself when nothing is registered" do
      expect(described_class.t("missing.completely")).to eq("missing.completely")
    end

    it "falls back to the key when I18n returns a nested hash rather than a string" do
      expect(described_class.t("errors.models")).to eq("errors.models")
    end

    it "interpolates hash placeholders" do
      TranslationString.create!(key: "greet", locale: "en", value: "Hello %{name}")

      expect(described_class.t("greet", name: "Rajya")).to eq("Hello Rajya")
    end

    it "returns the template when interpolation keys are missing" do
      TranslationString.create!(key: "greet", locale: "en", value: "Hello %{name}")

      expect(described_class.t("greet", other: "x")).to eq("Hello %{name}")
    end

    it "returns the template when interpolation raises ArgumentError" do
      TranslationString.create!(key: "greet", locale: "en", value: "%<name>d")

      expect(described_class.t("greet", name: "x")).to eq("%<name>d")
    end
  end
end
