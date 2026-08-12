require "rails_helper"

RSpec.describe Result do
  describe ".success" do
    it "is successful and carries the given value" do
      result = described_class.success(:the_value)

      expect(result).to be_success
      expect(result).not_to be_failure
      expect(result.value).to eq(:the_value)
    end

    it "defaults the value to nil" do
      expect(described_class.success.value).to be_nil
    end
  end

  describe ".failure" do
    it "is a failure and carries the error code and details" do
      result = described_class.failure(:not_found, details: { id: 1 })

      expect(result).to be_failure
      expect(result).not_to be_success
    end

    it "exposes the error code and details" do
      result = described_class.failure(:not_found, details: { id: 1 })

      expect(result.error_code).to eq(:not_found)
      expect(result.error_details).to eq(id: 1)
    end

    it "defaults details to an empty hash" do
      expect(described_class.failure(:not_found).error_details).to eq({})
    end
  end
end
