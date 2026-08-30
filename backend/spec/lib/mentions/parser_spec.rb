require "rails_helper"

RSpec.describe Mentions::Parser do
  it "parses account tokens and special everyone/admins mentions (NR-35)" do
    parsed = described_class.parse("hi <@11> <@11> <@everyone> and @admins")

    expect(parsed.account_ids).to eq([ 11 ])
    expect(parsed.everyone).to be(true)
    expect(parsed.admins).to be(true)
    expect(parsed).to be_special
  end

  it "ignores blank text, emails, and ordinary handles" do
    parsed = described_class.parse("mail everyone@example.com @ada")

    expect(parsed.account_ids).to eq([])
    expect(parsed).not_to be_special
    expect(described_class.parse(nil)).not_to be_special
  end
end
