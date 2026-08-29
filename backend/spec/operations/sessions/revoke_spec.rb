require "rails_helper"

RSpec.describe Sessions::Revoke do
  it "revokes the session" do
    session = create(:session)
    expect(described_class.call(session: session)).to be_success
    expect(session.reload).to be_revoked
  end
end
