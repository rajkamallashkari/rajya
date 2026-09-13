require "rails_helper"

RSpec.describe Messages::Preloader do
  it "loads sender avatars for nested account serialization" do
    sender = create(:user).account
    sender.avatar.attach(io: StringIO.new("png"), filename: "avatar.png", content_type: "image/png")
    message = create(:message, sender_account: sender)
    loaded = described_class.apply(Message.where(id: message.id)).sole

    expect(loaded.sender_account.association(:avatar_attachment)).to be_loaded
    expect(MessageResource.new(loaded).to_h.dig("sender", "avatar_url"))
      .to include("/rails/active_storage/")
  end
end
