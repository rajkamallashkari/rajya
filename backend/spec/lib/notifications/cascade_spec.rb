require "rails_helper"

RSpec.describe Notifications::Cascade do
  def merge(document, kind: "direct", conversation_id: 1)
    described_class.merge(document, kind: kind, conversation_id: conversation_id)
  end

  # rubocop:disable RSpec/ExampleLength -- table-driven four-scope cascade (BR-98)
  [
    {
      name: "returns registry defaults when notifications are absent",
      document: {},
      kind: "direct",
      id: 1,
      level: "all",
      sound: true
    },
    {
      name: "lets global override defaults key-by-key",
      document: { "notifications" => { "global" => { "level" => "mentions", "sound" => false } } },
      kind: "direct",
      id: 1,
      level: "mentions",
      sound: false
    },
    {
      name: "lets kind:direct override global",
      document: {
        "notifications" => {
          "global" => { "level" => "none" },
          "kind:direct" => { "level" => "all" }
        }
      },
      kind: "direct",
      id: 1,
      level: "all",
      sound: true
    },
    {
      name: "lets kind:group override global",
      document: {
        "notifications" => {
          "global" => { "level" => "all" },
          "kind:group" => { "level" => "mentions" }
        }
      },
      kind: "group",
      id: 9,
      level: "mentions",
      sound: true
    },
    {
      name: "lets kind:channel override global",
      document: {
        "notifications" => {
          "global" => { "level" => "all" },
          "kind:channel" => { "level" => "none" }
        }
      },
      kind: "channel",
      id: 3,
      level: "none",
      sound: true
    },
    {
      name: "lets conversation override kind key-by-key",
      document: {
        "notifications" => {
          "kind:group" => { "level" => "none", "sound" => false },
          "conversation:7" => { "level" => "mentions" }
        }
      },
      kind: "group",
      id: 7,
      level: "mentions",
      sound: false
    }
  ].each do |row|
    it row[:name] do
      result = merge(row[:document], kind: row[:kind], conversation_id: row[:id])
      expect(result["level"]).to eq(row[:level])
      expect(result["sound"]).to eq(row[:sound])
      expect(result["show_preview"]).to be(true)
    end
  end
  # rubocop:enable RSpec/ExampleLength

  it "exposes all eight whitelist keys from defaults (BR-99)" do
    result = merge({})
    expect(result.keys).to match_array(described_class::KEYS)
    expect(result["dnd_days"]).to eq((0..6).to_a)
  end

  it "rejects an unknown key on a stored scope (BR-99)" do
    document = { "notifications" => { "global" => { "level" => "all", "foo" => true } } }
    expect { merge(document) }.to raise_error(described_class::UnknownKey)
  end

  it "treats a non-hash document or notifications object as defaults" do
    expect(merge("x")["level"]).to eq("all")
    expect(merge({ "notifications" => "x" })["level"]).to eq("all")
    expect(merge({ "notifications" => { "global" => "x" } })["level"]).to eq("all")
  end

  it "ignores unknown keys on code-defined defaults" do
    stub_setting(
      :notification_cascade_defaults,
      { "level" => "none", "bogus" => true },
      category: "notifications"
    )
    result = merge({})
    expect(result["level"]).to eq("none")
    expect(result).not_to have_key("bogus")
  end
end
