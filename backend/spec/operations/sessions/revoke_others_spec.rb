require "rails_helper"

RSpec.describe Sessions::RevokeOthers do
  it "revokes every session except the current jti" do
    user = create(:user)
    current = create(:session, user: user)
    other = create(:session, user: user)

    expect(described_class.call(user: user, current_jti: current.jti)).to be_success
    expect(current.reload).not_to be_revoked
    expect(other.reload).to be_revoked
  end
end
