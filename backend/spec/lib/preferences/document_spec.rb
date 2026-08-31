require "rails_helper"

# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations -- document matrix
RSpec.describe Preferences::Document do
  describe ".materialize" do
    it "fills defaults and drops unknown stored keys" do
      stored = {
        "appearance" => { "theme" => "dark", "neon" => true, "wallpaper" => { "preset" => "dusk", "extra" => 1 } },
        "mystery" => { "x" => 1 },
        "notifications" => {
          "global" => { "level" => "mentions", "bonus" => true },
          "kind:group" => { "level" => "none" },
          "defaults" => { "level" => "all" }
        }
      }

      doc = described_class.materialize(stored)
      expect(doc.dig("appearance", "theme")).to eq("dark")
      expect(doc.dig("appearance", "density")).to eq("comfortable")
      expect(doc.dig("appearance", "wallpaper", "preset")).to eq("dusk")
      expect(doc.dig("appearance", "wallpaper")).not_to have_key("extra")
      expect(doc["appearance"]).not_to have_key("neon")
      expect(doc).not_to have_key("mystery")
      expect(doc.dig("notifications", "global", "level")).to eq("mentions")
      expect(doc.dig("notifications", "kind:group", "level")).to eq("none")
      expect(doc["notifications"]).not_to have_key("defaults")
    end

    it "treats a non-hash document as empty" do
      expect(described_class.materialize("x").dig("locale", "timezone")).to eq("UTC")
    end
  end

  describe ".dig" do
    it "reads a privacy default" do
      expect(described_class.dig({}, "privacy", "read_receipts")).to be(true)
    end
  end

  describe ".apply" do
    it "coerces types, ranges, enums, times, timezones and wallpaper floats" do
      result = described_class.apply({}, {
        "appearance" => {
          "theme" => "dark", "text_size" => "2", "wallpaper" => { "dim" => "0.25", "preset" => "mist" }
        },
        "locale" => { "timezone" => "Asia/Kolkata", "time_format" => "24h" },
        "chat" => { "enter_to_send" => false },
        "notifications" => {
          "global" => { "dnd_start" => "21:30", "dnd_days" => [ 1, 2 ] },
          "kind:direct" => { "level" => "mentions" },
          "conversation:9" => { "sound" => false }
        }
      })

      expect(result.ok?).to be(true)
      expect(result.stored.dig("appearance", "text_size")).to eq(2)
      expect(result.stored.dig("appearance", "wallpaper", "dim")).to eq(0.25)
      expect(result.stored.dig("notifications", "global", "dnd_days")).to eq([ 1, 2 ])
    end

    it "rejects unknown keys, scopes, ranges, formats and malformed values" do
      expect(described_class.apply({}, "x").errors).to have_key("data")
      expect(described_class.apply({}, { "nope" => {} }).errors).to have_key("nope")
      expect(described_class.apply({}, { "appearance" => "x" }).errors).to have_key("appearance")
      expect(described_class.apply({}, { "appearance" => { "theme" => "sepia" } }).errors).to have_key("appearance.theme")
      expect(described_class.apply({}, { "appearance" => { "text_size" => 9 } }).errors).to have_key("appearance.text_size")
      expect(described_class.apply({}, { "appearance" => { "text_size" => "no" } }).errors).to have_key("appearance.text_size")
      expect(described_class.apply({}, { "appearance" => { "split_accents" => "yes" } }).errors).to have_key("appearance.split_accents")
      expect(described_class.apply({}, { "appearance" => { "wallpaper" => "x" } }).errors).to have_key("appearance.wallpaper")
      expect(described_class.apply({}, { "appearance" => { "wallpaper" => { "zoom" => 1 } } }).errors)
        .to have_key("appearance.wallpaper.zoom")
      expect(described_class.apply({}, { "locale" => { "timezone" => "Not/AZone" } }).errors).to have_key("locale.timezone")
      expect(described_class.apply({}, { "notifications" => { "global" => { "dnd_start" => "25:00" } } }).errors)
        .to have_key("notifications.global.dnd_start")
      expect(described_class.apply({}, { "notifications" => { "kind:broadcast" => { "level" => "all" } } }).errors)
        .to have_key("notifications.kind:broadcast")
      expect(described_class.apply({}, { "notifications" => { "global" => { "volume" => 1 } } }).errors)
        .to have_key("notifications.global.volume")
      expect(described_class.apply({}, { "notifications" => { "global" => "x" } }).errors)
        .to have_key("notifications.global")
      expect(described_class.apply({}, { "chat" => { "quick_reactions" => %w[a] } }).errors)
        .to have_key("chat.quick_reactions")
      expect(described_class.apply({}, { "chat" => { "quick_reactions" => Array.new(6, "x" * 17) } }).errors)
        .to have_key("chat.quick_reactions[0]")
      expect(described_class.apply({}, { "chat" => { "quick_reactions" => [ 1, 2, 3, 4, 5, 6 ] } }).errors)
        .to have_key("chat.quick_reactions[0]")
      expect(described_class.apply({}, { "notifications" => { "global" => { "dnd_days" => [ 9 ] } } }).errors)
        .to have_key("notifications.global.dnd_days[0]")
      expect(described_class.apply({}, { "ai" => { "style_profile" => "nope" } }).errors).to have_key("ai.style_profile")
      expect(described_class.apply({}, { "locale" => { "language" => :zz } }).errors).to have_key("locale.language")
    end

    it "accepts a style profile blob and nullable font ids" do
      result = described_class.apply({}, {
        "ai" => { "style_profile" => { "global" => "casual" }, "style_profile_enabled" => true },
        "appearance" => { "font_config_id" => nil }
      })

      expect(result.ok?).to be(true)
      expect(result.stored.dig("ai", "style_profile", "global")).to eq("casual")
      expect(result.stored.dig("appearance", "font_config_id")).to be_nil
    end

    it "allows an empty optional string to become nil" do
      result = described_class.apply({}, { "ai" => { "style_profile_updated_at" => "" } })

      expect(result.ok?).to be(true)
      expect(result.stored.dig("ai", "style_profile_updated_at")).to be_nil
    end

    it "rejects a non-string optional timestamp" do
      expect(described_class.apply({}, { "ai" => { "style_profile_updated_at" => 1 } }).errors)
        .to have_key("ai.style_profile_updated_at")
    end

    it "rejects a nil required value" do
      expect(described_class.apply({}, { "appearance" => { "theme" => nil } }).errors).to have_key("appearance.theme")
    end

    it "coerces ActionController parameters" do
      params = ActionController::Parameters.new({ "appearance" => { "theme" => "light" } })
      result = described_class.apply({}, params)

      expect(result.ok?).to be(true)
      expect(result.stored.dig("appearance", "theme")).to eq("light")
    end

    it "rejects an unregistered field type added in the spec" do
      Preferences::Registry.with_temporary_field("chat", "raw", type: :other, default: 1) do
        expect(described_class.apply({}, { "chat" => { "raw" => 1 } }).errors).to have_key("chat.raw")
      end
    end

    it "rejects a non-array for an array field" do
      expect(described_class.apply({}, { "chat" => { "quick_reactions" => "👍" } }).errors)
        .to have_key("chat.quick_reactions")
    end

    it "rejects out-of-range floats and integer-looking floats" do
      expect(described_class.apply({}, { "appearance" => { "wallpaper" => { "dim" => 1.5 } } }).errors)
        .to have_key("appearance.wallpaper.dim")
      expect(described_class.apply({}, { "appearance" => { "text_size" => 1.5 } }).errors)
        .to have_key("appearance.text_size")
    end

    it "rejects a date format that is not one of the eleven registry values" do
      expect(described_class.apply({}, { "locale" => { "date_format" => "unix" } }).errors)
        .to have_key("locale.date_format")
    end

    it "stores an explicit null style profile" do
      result = described_class.apply({}, { "ai" => { "style_profile" => nil } })

      expect(result.ok?).to be(true)
      expect(result.stored.dig("ai", "style_profile")).to be_nil
    end

    it "rejects a notifications hash that is not an object at the namespace" do
      expect(described_class.apply({}, { "notifications" => [] }).errors).to have_key("notifications")
    end

    it "fills defaults when a stored namespace is not a hash" do
      expect(described_class.materialize("appearance" => "dark").dig("appearance", "theme")).to eq("system")
    end

    it "coerces an integer that has no min or max" do
      Preferences::Registry.with_temporary_field("chat", "count", type: :integer, default: 0) do
        result = described_class.apply({}, { "chat" => { "count" => "4" } })
        expect(result.ok?).to be(true)
        expect(result.stored.dig("chat", "count")).to eq(4)
      end
    end

    it "rejects an unknown notification scope during coerce" do
      errors = {}
      node = Preferences::Registry.tree.fetch("notifications")
      described_class.send(:coerce_scoped, node, { "kind:nope" => {} }, "notifications", errors)
      expect(errors).to have_key("notifications.kind:nope")
    end

    it "rejects an unknown field during coerce" do
      errors = {}
      fields = Preferences::Registry.tree.fetch("chat").fetch(:fields)
      described_class.send(:coerce_fields, fields, { "nope" => true }, "chat", errors)
      expect(errors).to have_key("chat.nope")
    end

    it "rejects a non-object value during field coerce" do
      errors = {}
      fields = Preferences::Registry.tree.fetch("chat").fetch(:fields)
      described_class.send(:coerce_fields, fields, "x", "chat", errors)
      expect(errors).to have_key("chat")
    end

    it "rejects a field lookup when the node has no field map" do
      errors = {}
      described_class.send(:reject_unknown_field, { type: :namespace }, "theme", "dark", "appearance", errors)
      expect(errors).to have_key("appearance")
    end

    it "accepts a six-item quick-reaction list" do
      result = described_class.apply({}, { "chat" => { "quick_reactions" => %w[a b c d e f] } })
      expect(result.stored.dig("chat", "quick_reactions")).to eq(%w[a b c d e f])
    end

    it "rejects an integer below the registered minimum" do
      expect(described_class.apply({}, { "appearance" => { "text_size" => -9 } }).errors)
        .to have_key("appearance.text_size")
    end

    it "rejects a string that is not in the field allow-list" do
      Preferences::Registry.with_temporary_field("chat", "mode", type: :string, default: "a", values: %w[a b]) do
        expect(described_class.apply({}, { "chat" => { "mode" => "z" } }).errors).to have_key("chat.mode")
      end
    end

    it "treats a nil json value as null during coerce" do
      expect(described_class.send(:coerce_json, nil, "ai.style_profile", {})).to be_nil
    end
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
