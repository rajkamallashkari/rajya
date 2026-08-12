require "rails_helper"

RSpec.describe ApplicationOperation do
  let(:operation_class) do
    Class.new(described_class) do
      def call(succeed:)
        succeed ? success(:ok) : failure(:validation_failed, details: { field: "bad" })
      end
    end
  end

  let(:unregistered_code_operation_class) do
    Class.new(described_class) do
      def call
        failure(:not_a_real_code)
      end
    end
  end

  describe ".call" do
    it "delegates to a new instance's #call" do
      expect(operation_class.call(succeed: true)).to be_success
    end
  end

  describe "#success" do
    it "returns a successful Result wrapping the value" do
      result = operation_class.new.call(succeed: true)

      expect(result).to be_success
      expect(result.value).to eq(:ok)
    end
  end

  describe "#failure" do
    it "returns a failed Result for a known error code" do
      result = operation_class.new.call(succeed: false)

      expect(result).to be_failure
      expect(result.error_code).to eq(:validation_failed)
      expect(result.error_details).to eq(field: "bad")
    end

    it "raises for an unregistered error code" do
      expect { unregistered_code_operation_class.call }.to raise_error(Errors::UnknownErrorCode)
    end
  end
end
