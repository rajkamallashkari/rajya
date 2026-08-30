require "rails_helper"

RSpec.describe GalleryPageResource do
  def page_json(items)
    described_class.new(
      Conversations::Gallery::Result.new(items: items, page: 1, per_page: 30, total: items.size, has_more: false)
    ).to_h
  end

  it "serializes attachment items with the parent message id" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    attachment = create(:attachment, message: message, processing_status: "failed", processing_error: "unreadable")
    attachment.file.attach(io: StringIO.new("x"), filename: "a.png", content_type: "image/png")
    json = page_json([ attachment ])

    expect(json.fetch("meta")).to include("page" => 1, "has_more" => false)
    expect(json.dig("items", 0, "attachment")).to include("id" => attachment.id, "message_id" => message.id)
    expect(json.fetch("items").first).to include("item_kind" => "attachment", "link" => nil)
  end

  it "serializes ready link previews" do
    preview = create(:link_preview, status: "ready", title: "Doc", description: "Body", site_name: "Site")
    json = page_json([ preview ])

    expect(json.fetch("items").last).to include(
      "item_kind" => "link",
      "attachment" => nil,
      "link" => { "url" => preview.url, "title" => "Doc", "description" => "Body", "site_name" => "Site" }
    )
  end
end
