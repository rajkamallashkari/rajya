require "rails_helper"

RSpec.describe Theme::Contrast do
  it "accepts DESIGN_SYSTEM light text-primary on surface-app" do
    expect(described_class.sufficient?("#1E293B", "#EFF6FF")).to be(true)
  end

  it "rejects near-identical foreground and background" do
    expect(described_class.sufficient?("#FFFFFF", "#FFFFFE")).to be(false)
  end

  it "treats an accent as readable when it contrasts with white or near-black" do
    expect(described_class.accent_readable?("#4F46E5")).to be(true)
    expect(described_class.accent_readable?("#777777")).to be(false)
  end

  it "linearizes both sRGB ranges" do
    dark = described_class.relative_luminance("#000000")
    light = described_class.relative_luminance("#FFFFFF")

    expect(dark).to eq(0.0)
    expect(light).to eq(1.0)
  end
end
