require "rails_helper"

# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations
RSpec.describe Search::Filters do
  it "parses composed filters and treats blanks as empty" do
    parsed = described_class.parse(
      sender_account_id: "9",
      created_after: "2026-01-01T00:00:00Z",
      created_before: "2026-01-31T23:59:59Z",
      kind: "image",
      has_attachment: "true",
      has_link: false
    )

    expect(parsed.sender_account_id).to eq(9)
    expect(parsed.kind).to eq("image")
    expect(parsed.has_attachment).to be(true)
    expect(parsed.has_link).to be(false)
    expect(parsed.present?).to be(true)
    expect(described_class.parse({}).present?).to be(false)
    expect(described_class.empty.present?).to be(false)
  end

  it "rejects invalid kind, time, and sender values" do
    expect(described_class.parse(kind: "sticker")).to be_nil
    expect(described_class.parse(created_after: "not-a-time")).to be_nil
    expect(described_class.parse(created_before: "nope")).to be_nil
    expect(described_class.parse(sender_account_id: "x")).to be_nil
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
