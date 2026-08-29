require "rails_helper"

RSpec.describe Users::UpdateProfile do
  it "updates display name, username, and bio" do
    user = create(:user)
    result = described_class.call(user: user, display_name: " Ada ", username: "ada_l", bio: " hi ")

    expect(result).to be_success
    expect(user.account.reload.display_name).to eq("Ada")
    expect(user.account.username).to eq("ada_l")
    expect(user.account.bio).to eq("hi")
  end

  it "rejects a blank display name" do
    user = create(:user)
    expect(described_class.call(user: user, display_name: " ", username: "ada").error_code).to eq(:validation_failed)
  end

  it "rejects an invalid or taken username" do
    user = create(:user)
    create(:account, username: "taken")
    expect(described_class.call(user: user, display_name: "Ada", username: "ab").error_code).to eq(:validation_failed)
    expect(described_class.call(user: user, display_name: "Ada", username: "taken").error_code).to eq(:validation_failed)
  end

  it "allows keeping the current username and attaches an avatar" do
    user = create(:user)
    file = Tempfile.new([ "avatar", ".png" ])
    file.write("png")
    file.rewind
    upload = Rack::Test::UploadedFile.new(file.path, "image/png")
    result = described_class.call(user: user, display_name: user.account.display_name,
                                  username: user.account.username, avatar: upload)

    expect(result).to be_success
    expect(user.account.reload.avatar).to be_attached
  ensure
    file.close!
  end
end
