require "rails_helper"

RSpec.describe Gifs::Import do
  def hit
    Gifs::Tenor::Result.new(id: "t1", title: "Party", preview_url: "https://cdn.example/p.gif", gif_url: "https://cdn.example/g.gif")
  end

  it "uploads fetched bytes as a gif blob" do
    user = create(:user)
    create(:storage_bucket, service_name: "test")
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: true)
    client = instance_double(Gifs::Tenor, fetch: hit, download: "GIF89a")
    result = described_class.call(account: user.account, gif_id: "t1", client: client)

    expect(result).to be_success
    expect(result.value.content_type).to eq("image/gif")
    expect(result.value.byte_size).to eq("GIF89a".bytesize)
  end

  it "404s when gif_search is off" do
    user = create(:user)
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: false)
    expect(described_class.call(account: user.account, gif_id: "t1").error_code).to eq(:not_found)
  end

  it "rejects a blank gif id" do
    user = create(:user)
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: true)
    expect(described_class.call(account: user.account, gif_id: " ").error_code).to eq(:validation_failed)
  end

  it "404s a missing Tenor hit" do
    user = create(:user)
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: true)
    client = instance_double(Gifs::Tenor, fetch: nil)
    expect(described_class.call(account: user.account, gif_id: "t1", client: client).error_code).to eq(:not_found)
  end

  it "surfaces upstream fetch and download failures" do
    user = create(:user)
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: true)
    missing = instance_double(Gifs::Tenor, fetch: :upstream_failed)
    expect(described_class.call(account: user.account, gif_id: "t1", client: missing).error_code).to eq(:upstream_failed)
    empty = instance_double(Gifs::Tenor, fetch: hit, download: nil)
    expect(described_class.call(account: user.account, gif_id: "t1", client: empty).error_code).to eq(:upstream_failed)
  end

  it "rejects when quota is exhausted" do
    user = create(:user)
    create(:storage_bucket, service_name: "test")
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: true)
    create(:storage_quota, account: user.account, quota_bytes: 1, used_bytes: 0)
    client = instance_double(Gifs::Tenor, fetch: hit, download: "GIF89a")
    expect(described_class.call(account: user.account, gif_id: "t1", client: client).error_code).to eq(:quota_exceeded)
  end
end
