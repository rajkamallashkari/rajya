require "rails_helper"

module CableAdapterParity; end

# Channel suite against both transports (P4 DoD / TARGET §1). Functional
# channel specs use the test adapter; this file boots the real Redis and Solid
# Cable adapters and proves a broadcast lands.
RSpec.describe CableAdapterParity do
  def parsed_cable(adapter)
    previous = ENV.fetch("CABLE_ADAPTER", nil)
    ENV["CABLE_ADAPTER"] = adapter
    YAML.safe_load(ERB.new(Rails.root.join("config/cable.yml").read).result, aliases: true)
  ensure
    if previous.nil?
      ENV.delete("CABLE_ADAPTER")
    else
      ENV["CABLE_ADAPTER"] = previous
    end
  end

  def with_pubsub(config)
    previous = ActionCable.server.config.cable
    ActionCable.server.config.cable = config
    ActionCable.server.instance_variable_set(:@pubsub, nil)
    yield ActionCable.server.pubsub
  ensure
    ActionCable.server.config.cable = previous
    ActionCable.server.instance_variable_set(:@pubsub, nil)
  end

  it "selects redis or solid_cable from CABLE_ADAPTER (TARGET §1)" do
    expect(parsed_cable("redis").fetch("production").fetch("adapter")).to eq("redis")
    expect(parsed_cable("solid").fetch("production").fetch("adapter")).to eq("solid_cable")
  end

  it "broadcasts through the Redis adapter" do
    with_pubsub(
      "adapter" => "redis",
      "url" => ENV.fetch("REDIS_URL", "redis://localhost:6379/0"),
      "channel_prefix" => "rajya_test_parity"
    ) do |pubsub|
      expect(pubsub).to be_a(ActionCable::SubscriptionAdapter::Redis)
      expect { pubsub.broadcast("parity-redis", "ok") }.not_to raise_error
    end
  end

  it "broadcasts through the Solid Cable adapter" do
    with_pubsub(
      "adapter" => "solid_cable",
      "polling_interval" => 0.1,
      "message_retention" => 1.day
    ) do |pubsub|
      expect(pubsub).to be_a(ActionCable::SubscriptionAdapter::SolidCable)
      expect { pubsub.broadcast("parity-solid", "ok") }
        .to change(SolidCable::Message, :count).by(1)
    end
  end
end
