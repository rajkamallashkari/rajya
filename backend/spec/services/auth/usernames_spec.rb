require "rails_helper"

RSpec.describe Auth::Usernames do
  it "derives a handle from the email local-part" do
    expect(described_class.from_email("Ada.Lovelace+tag@example.com")).to eq("Ada.Lovelacetag")
  end

  it "pads a short local-part to the minimum length" do
    expect(described_class.from_email("ab@example.com")).to eq("ab_1")
  end

  it "falls back when the local-part sanitizes to empty" do
    expect(described_class.from_email("+++@example.com")).to eq("user")
  end

  it "appends a numeric suffix when the handle is taken" do
    create(:account, username: "ada")

    expect(described_class.from_email("ada@example.com")).to eq("ada_1")
  end

  it "keeps a suffix when max length cannot fit the base plus suffix" do
    allow(Settings).to receive(:fetch).and_call_original
    allow(Settings).to receive(:fetch).with(:username_min_length).and_return(2)
    allow(Settings).to receive(:fetch).with(:username_max_length).and_return(2)
    create(:account, username: "ab")

    expect(described_class.from_email("ab@example.com")).to eq("a_1")
  end

  it "falls back to a random handle after too many collisions" do
    allow(described_class).to receive(:taken?).and_return(true)

    expect(described_class.from_email("ada@example.com")).to match(/\Auser_[0-9a-f]{6}\z/)
  end

  it "accepts handles that match the length and character rules" do
    expect(described_class.valid_format?("ada_1")).to be(true)
    expect(described_class.valid_format?("ab")).to be(false)
    expect(described_class.valid_format?("ada!")).to be(false)
  end

  it "treats the current account's handle as available" do
    account = create(:account, username: "ada")

    expect(described_class.available?("ada", except_id: account.id)).to be(true)
    expect(described_class.available?("ada")).to be(false)
  end
end
