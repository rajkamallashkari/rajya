require "rails_helper"

RSpec.describe ContactNicknames::Index do
  it "wraps the scoped relation with the target account preloaded" do
    nickname = create(:contact_nickname)
    result = described_class.call(nicknames: ContactNickname.where(id: nickname.id))

    expect(result.value.nicknames).to contain_exactly(nickname)
    expect(result.value.nicknames.first.association(:target_account)).to be_loaded
  end
end
