require "rails_helper"

RSpec.describe Calls::IceServers do
  include ActiveSupport::Testing::TimeHelpers
  def with_env(vars)
    previous = vars.keys.index_with { |key| ENV[key] }
    vars.each { |key, value| value.nil? ? ENV.delete(key) : ENV[key] = value }
    yield
  ensure
    previous.each { |key, value| value.nil? ? ENV.delete(key) : ENV[key] = value }
  end

  it "returns only STUN URLs when TURN is unset" do
    with_env("TURN_SECRET" => nil, "TURN_HOST" => nil, "METERED_API_KEY" => nil, "METERED_APP_DOMAIN" => nil) do
      servers = described_class.new.credentials_for(create(:account))
      expect(servers.size).to eq(Settings.fetch(:stun_urls).size)
      expect(servers.map { |row| row.fetch("urls") }).to all(start_with("stun:"))
    end
  end

  it "prefers coturn HMAC credentials over Metered (BR-71)" do # rubocop:disable RSpec/ExampleLength
    vars = { "TURN_SECRET" => "secret", "TURN_HOST" => "turn.example.com",
             "METERED_API_KEY" => "k", "METERED_APP_DOMAIN" => "metered.example" }
    with_env(vars) do
      freeze_time do
        account = create(:account)
        turn = described_class.new(http: instance_double(described_class::Http)).credentials_for(account).last
        expiry = Settings.fetch(:turn_credential_ttl).seconds.from_now.to_i
        expect(turn.fetch("username")).to eq("#{expiry}:#{account.id}")
        expect(turn.fetch("urls")).to include("turn:turn.example.com:#{Settings.fetch(:turn_port)}?transport=tcp")
      end
    end
  end

  it "uses Metered when coturn is unset and caches a successful array" do # rubocop:disable RSpec/ExampleLength
    http = instance_double(described_class::Http)
    payload = [ { "urls" => "turn:metered.example", "username" => "u", "credential" => "c" } ]
    allow(http).to receive(:get_json).and_return(payload)
    original = Rails.cache
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    env = { "TURN_SECRET" => nil, "TURN_HOST" => nil, "METERED_API_KEY" => "k", "METERED_APP_DOMAIN" => "metered.example" }
    with_env(env) do
      first = described_class.new(http: http).credentials_for(create(:account))
      second = described_class.new(http: http).credentials_for(create(:account))
      expect([ first.last, second.last ]).to eq([ payload.first, payload.first ])
      expect(http).to have_received(:get_json).once
    end
  ensure
    Rails.cache = original
  end

  it "falls back to STUN when Metered returns a non-array" do
    http = instance_double(described_class::Http, get_json: { "error" => "no" })
    with_env("TURN_SECRET" => nil, "TURN_HOST" => nil, "METERED_API_KEY" => "k", "METERED_APP_DOMAIN" => "metered.example") do
      servers = described_class.new(http: http).credentials_for(create(:account))
      expect(servers.map { |row| row.fetch("urls") }).to all(start_with("stun:"))
    end
  end

  it "ignores a partial TURN or Metered env" do
    with_env("TURN_SECRET" => "secret", "TURN_HOST" => nil, "METERED_API_KEY" => "k", "METERED_APP_DOMAIN" => nil) do
      servers = described_class.new.credentials_for(create(:account))
      expect(servers.map { |row| row.fetch("urls") }).to all(start_with("stun:"))
    end
  end
end
