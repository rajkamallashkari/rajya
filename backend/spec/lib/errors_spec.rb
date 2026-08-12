require "rails_helper"

RSpec.describe Errors do
  describe ".http_status_for" do
    it "returns the HTTP status for a known code" do
      expect(described_class.http_status_for(:not_found)).to eq(404)
    end

    it "raises UnknownErrorCode for an unregistered code" do
      expect { described_class.http_status_for(:not_a_real_code) }.to raise_error(Errors::UnknownErrorCode)
    end
  end

  describe ".message_for" do
    it "resolves the message from the locale catalog for a known code" do
      expect(described_class.message_for(:not_found)).to be_a(String)
    end

    it "humanizes the code when no translation exists" do
      expect(described_class.message_for(:totally_unmapped_code)).to eq("Totally unmapped code")
    end
  end

  describe ".render" do
    it "shapes the error body with the resolved message and given details" do
      expect(described_class.render(:forbidden, details: { field: "x" })).to eq(
        error: { code: :forbidden, message: described_class.message_for(:forbidden), details: { field: "x" } }
      )
    end

    it "prefers an explicit message over the catalog" do
      body = described_class.render(:forbidden, message: "custom")
      expect(body[:error][:message]).to eq("custom")
    end
  end
end
