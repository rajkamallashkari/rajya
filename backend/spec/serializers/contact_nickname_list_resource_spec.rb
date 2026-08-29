require "rails_helper"

RSpec.describe ContactNicknameListResource do
  it "nests nicknames" do
    nickname = create(:contact_nickname)
    json = described_class.new(ContactNicknames::List.new(nicknames: [ nickname ])).to_h

    expect(json.fetch("nicknames").first.fetch("nickname")).to eq(nickname.nickname)
  end
end
