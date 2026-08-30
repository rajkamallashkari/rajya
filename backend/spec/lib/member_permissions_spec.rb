require "rails_helper"

RSpec.describe MemberPermissions do
  it "accepts a document of registered keys and roles and rejects anything else" do
    expect(described_class.valid?("send_messages" => "admin")).to be(true)
    expect(described_class.valid?({})).to be(true)
    expect(described_class.valid?("send_messages" => "moderator")).to be(false)
    expect(described_class.valid?([])).to be(false)
  end

  it "rejects an unknown permission key" do
    expect(described_class.valid?("remove_members" => "admin")).to be(false)
  end

  it "treats a missing key as member and never ranks an unknown role above owner" do
    expect(described_class.min_role({}, "send_messages")).to eq("member")
    expect(described_class.allows?(role: "member", document: {}, key: "add_members")).to be(true)
    expect(described_class.allows?(role: "member", document: { "add_members" => "admin" }, key: "add_members"))
      .to be(false)
    expect(described_class.rank("ghost")).to eq(-1)
  end

  it "does not let an admin meet an owner-only override" do
    expect(described_class.allows?(role: "admin", document: { "add_members" => "owner" }, key: "add_members"))
      .to be(false)
  end

  it "lets an owner meet an admin override and treats a non-hash as unrestricted" do
    expect(described_class.allows?(role: "owner", document: { "add_members" => "admin" }, key: "add_members"))
      .to be(true)
    expect(described_class.min_role(nil, "send_messages")).to eq("member")
    expect(described_class.valid?(send_messages: "admin")).to be(true)
  end
end
