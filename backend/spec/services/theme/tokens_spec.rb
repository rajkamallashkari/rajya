require "rails_helper"

RSpec.describe Theme::Tokens do
  it "exposes defaults for both themes" do
    expect(described_class.defaults_for(:light).fetch("--text-primary")).to eq("#1E293B")
    expect(described_class.defaults_for("dark").fetch("--text-primary")).to eq("#F1F5F9")
  end

  it "pairs body text with the app surface" do
    expect(described_class.pair_for("--text-primary")).to eq("--surface-app")
  end

  it "does not treat computed accent derivatives as overridable" do
    expect(described_class.overridable?("--accent")).to be(true)
    expect(described_class.overridable?("--accent-contrast")).to be(false)
  end

  it "keeps default text/surface pairings above WCAG AA" do
    failures = Theme::Tokens::THEMES.flat_map do |theme|
      palette = described_class.defaults_for(theme)
      described_class::PAIRINGS.filter_map do |token, partner|
        next if Theme::Contrast.sufficient?(palette.fetch(token), palette.fetch(partner))

        "#{theme} #{token} vs #{partner}"
      end
    end

    expect(failures).to eq([])
  end
end
