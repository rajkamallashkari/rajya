require "rails_helper"

RSpec.describe Monitoring::Reporter do
  after { described_class.sink = nil }

  it "logs the error and forwards to the sink when one is configured" do
    seen = []
    described_class.sink = ->(error, context) { seen << [ error, context ] }
    error = RuntimeError.new("boom")

    described_class.capture(error, context: { "path" => "/up" })

    expect(seen).to eq([ [ error, { "path" => "/up" } ] ])
  end

  it "logs without a sink" do
    expect { described_class.capture(RuntimeError.new("boom")) }.not_to raise_error
  end
end
