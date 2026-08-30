require "rails_helper"

RSpec.describe Gifs::Search do
  def hit
    Gifs::Tenor::Result.new(id: "t1", title: "Party", preview_url: "https://cdn.example/p.gif", gif_url: "https://cdn.example/g.gif")
  end

  it "returns mapped hits when the flag is on" do
    account = create(:user).account
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: true)
    client = instance_double(Gifs::Tenor, search: [ hit ])
    result = described_class.call(account: account, query: "party", client: client)

    expect(result.value.gifs.sole).to have_attributes(id: "t1", title: "Party", preview_url: "https://cdn.example/p.gif")
  end

  it "rejects a short query, a missing flag, and an upstream failure" do
    account = create(:user).account
    create(:feature_flag, key: "gif_search", description: FeatureFlagRegistry.description_for(:gif_search), enabled: false)
    expect(described_class.call(account: account, query: "party").error_code).to eq(:not_found)

    FeatureFlag.find_by(key: "gif_search").update!(enabled: true)
    expect(described_class.call(account: account, query: "x").error_code).to eq(:validation_failed)
    client = instance_double(Gifs::Tenor, search: :upstream_failed)
    expect(described_class.call(account: account, query: "party", client: client).error_code).to eq(:upstream_failed)
    client = instance_double(Gifs::Tenor, search: :missing_key)
    expect(described_class.call(account: account, query: "party", client: client).error_code).to eq(:upstream_failed)
  end
end
