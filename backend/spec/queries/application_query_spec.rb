require "rails_helper"

RSpec.describe ApplicationQuery do
  let(:query_class) do
    Class.new(described_class) do
      def initialize(scope)
        @scope = scope
      end

      def call
        @scope
      end
    end
  end

  describe ".call" do
    it "delegates to a new instance's #call" do
      expect(query_class.call(:some_scope)).to eq(:some_scope)
    end
  end

  describe "#call" do
    it "raises NotImplementedError when a subclass does not override it" do
      expect { described_class.new.call }.to raise_error(NotImplementedError, /must implement #call/)
    end
  end
end
