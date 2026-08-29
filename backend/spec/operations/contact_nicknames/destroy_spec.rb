require "rails_helper"

RSpec.describe ContactNicknames::Destroy do
  it "destroys the nickname" do
    nickname = create(:contact_nickname)
    expect(described_class.call(nickname: nickname)).to be_success
    expect(ContactNickname.where(id: nickname.id)).not_to exist
  end
end
