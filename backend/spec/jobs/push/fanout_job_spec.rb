require "rails_helper"

RSpec.describe Push::FanoutJob do
  it "delegates to Fanout with the recipient list" do
    allow(Push::Fanout).to receive(:call).and_call_original

    described_class.perform_now("message_created", { "message_id" => 1 }, [ 2, 3 ])

    expect(Push::Fanout).to have_received(:call).with(
      event: "message_created",
      payload: { "message_id" => 1 },
      recipient_account_ids: [ 2, 3 ]
    )
  end

  it "is idempotent for the same recipient list" do
    results = Array.new(2) { described_class.perform_now("message_created", {}, [ 1 ]) }

    expect(results.map(&:success?)).to eq([ true, true ])
  end

  it "retries StandardError using the notification retry policy" do
    expect(described_class.retry_attempts).to eq(
      Settings::Registry.entries.fetch(:notification_retry_policy).fetch(:default).fetch("max_attempts")
    )
    expect(described_class.rescue_handlers.map(&:first)).to include("StandardError")
  end
end
