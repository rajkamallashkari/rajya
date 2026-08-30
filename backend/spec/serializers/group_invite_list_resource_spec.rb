require "rails_helper"

RSpec.describe GroupInviteListResource do
  it "wraps invites" do
    invite = create(:group_invite)
    json = described_class.new(Invites::List.new(invites: [ invite ])).to_h

    expect(json.fetch("invites").sole.fetch("token")).to eq(invite.token)
  end
end
