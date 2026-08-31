require "rails_helper"

RSpec.describe Preferences do
  it "delegates payload and typescript through the module facade" do
    expect(described_class.registry_payload.fetch("fields").keys).to include("appearance.theme")
    expect(described_class.typescript).to include("PreferenceDocument")
  end

  it "installs a registry document through define" do
    described_class.define { namespace("probe") { boolean :on, default: false } }
    expect(Preferences::Registry.tree.keys).to eq([ "probe" ])
  ensure
    Preferences::Schema.install
  end
end
