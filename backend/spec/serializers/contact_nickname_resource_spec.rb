require "rails_helper"

RSpec.describe ContactNicknameResource do
  it "includes the nickname and the target account, not the owner" do
    nickname = create(:contact_nickname, nickname: "Ada")
    json = described_class.new(nickname).to_h

    expect(json.fetch("nickname")).to eq("Ada")
    expect(json.fetch("account").fetch("id")).to eq(nickname.target_account_id)
    expect(json).not_to have_key("owner_account_id")
  end
end
