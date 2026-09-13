require "rails_helper"

RSpec.describe BotRequestResource do
  it "serializes a preloaded staged avatar URL" do
    request = create(:bot_request)
    request.avatar.attach(blob_signed_id)
    request.association(:avatar_attachment).load_target

    expect(described_class.new(request).to_h.fetch("avatar_url")).to include("/rails/active_storage/")
  end
end
