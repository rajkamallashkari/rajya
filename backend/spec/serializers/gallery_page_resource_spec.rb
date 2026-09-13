require "rails_helper"

RSpec.describe GalleryPageResource do
  def page_json(items)
    described_class.new(
      Conversations::Gallery::Result.new(items: items, page: 1, per_page: 30, total: items.size, has_more: false)
    ).to_h
  end

  it "serializes attachment items with the parent message id" do # rubocop:disable RSpec/ExampleLength
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account)
    attachment = create(:attachment, message: message, processing_status: "failed", processing_error: "unreadable")
    attachment.file.attach(io: StringIO.new("x"), filename: "a.png", content_type: "image/png")
    json = page_json([ attachment ])

    expect(json.fetch("meta")).to include("page" => 1, "has_more" => false)
    expect(json.dig("items", 0, "attachment")).to include(
      "id" => attachment.id,
      "message_id" => message.id,
      "sender" => include("display_name" => user.account.display_name),
      "sent_at" => message.created_at
    )
    expect(json.fetch("items").first).to include("item_kind" => "attachment", "link" => nil)
  end # rubocop:enable RSpec/ExampleLength

  it "serializes ready link previews" do # rubocop:disable RSpec/ExampleLength
    user = create(:user)
    message = create(:message, sender_account: user.account)
    link = Conversations::Gallery::LinkItem.new(
      url: "https://example.test",
      title: "Doc",
      description: "Body",
      site_name: "Site",
      message: message
    )
    json = page_json([ link ])

    expect(json.fetch("items").last).to include(
      "item_kind" => "link",
      "attachment" => nil,
      "link" => include(
        "url" => link.url,
        "title" => "Doc",
        "description" => "Body",
        "site_name" => "Site",
        "message_id" => message.id,
        "sender" => include("display_name" => user.account.display_name),
        "sent_at" => message.created_at
      )
    )
  end # rubocop:enable RSpec/ExampleLength
end
