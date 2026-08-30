require "rails_helper"

RSpec.describe GroupInviteResource do
  it "includes usable and optional limits" do
    invite = create(:group_invite, max_uses: 3, uses_count: 1, requires_approval: true)
    json = described_class.new(invite).to_h

    expect(json).to include(
      "id" => invite.id, "token" => invite.token, "requires_approval" => true,
      "max_uses" => 3, "uses_count" => 1, "usable" => true
    )
  end
end
