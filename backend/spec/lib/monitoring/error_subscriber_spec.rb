require "rails_helper"

RSpec.describe Monitoring::ErrorSubscriber do
  after { Monitoring::Reporter.sink = nil }

  it "captures unhandled errors and ignores handled ones" do
    seen = []
    Monitoring::Reporter.sink = ->(error, context) { seen << [ error.message, context ] }
    error = RuntimeError.new("unhandled")

    described_class.new.report(error, handled: true, severity: :error, context: {}, source: "app")
    described_class.new.report(error, handled: false, severity: :error, context: { "a" => 1 }, source: "job")
    described_class.new.report(SystemStackError.new, handled: false, severity: :error, context: {}, source: "app")

    expect(seen).to eq([ [ "unhandled", { "severity" => "error", "source" => "job" } ] ])
  end
end
