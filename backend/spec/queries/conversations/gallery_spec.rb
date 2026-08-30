require "rails_helper"

RSpec.describe Conversations::Gallery do
  def attach_file(message, kind:, filename:)
    row = create(:attachment, message: message, kind: kind, content_type: kind == "image" ? "image/png" : "application/pdf")
    row.file.attach(io: StringIO.new("x"), filename: filename, content_type: row.content_type)
    row
  end

  it "omits tombstoned messages from the image gallery" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    kept = create(:message, conversation: conversation, sender_account: user.account, position: 1)
    gone = create(:message, conversation: conversation, sender_account: user.account, position: 2)
    attach_file(kept, kind: "image", filename: "a.png")
    attach_file(gone, kind: "image", filename: "c.png")
    gone.update!(deleted_at: Time.current)

    page = described_class.call(conversation: conversation, kind: "images")

    expect(page.total).to eq(1)
  end

  it "pages images and videos newest-first" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    kept = create(:message, conversation: conversation, sender_account: user.account, position: 1)
    older = attach_file(kept, kind: "image", filename: "a.png")
    newer = attach_file(kept, kind: "video", filename: "b.mp4")
    AppSetting.create!(key: "gallery_page_size", value: 1, category: "media")

    first = described_class.call(conversation: conversation, kind: "images", page: 1)
    second = described_class.call(conversation: conversation, kind: "images", page: 2)

    expect(first.items).to eq([ newer ])
    expect(first.has_more).to be(true)
    expect(second.items).to eq([ older ])
    expect(second.has_more).to be(false)
  end

  it "lists files and ready link previews" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    message = create(:message, conversation: conversation, sender_account: user.account, position: 1)
    file = attach_file(message, kind: "file", filename: "notes.pdf")
    preview = create(:link_preview, status: "ready", title: "Example", site_name: "Ex")
    create(:message_link_preview, message: message, link_preview: preview)
    create(:link_preview, status: "pending")

    files = described_class.call(conversation: conversation, kind: "files")
    links = described_class.call(conversation: conversation, kind: "links")

    expect(files.items).to eq([ file ])
    expect(links.items).to eq([ preview ])
  end

  it "treats a blank page as the first page" do
    conversation = create_direct_between(create(:account), create(:account))
    page = described_class.call(conversation: conversation, kind: "images", page: 0)

    expect(page.page).to eq(1)
    expect(page.items).to eq([])
  end

  context "when measuring N+1", :n_plus_one do
    let(:holder) { {} }

    populate do |count|
      owner = create(:user)
      conversation = create_direct_between(owner.account, create(:account))
      count.times do |index|
        message = create(:message, conversation: conversation, sender_account: owner.account, position: index + 1)
        attach_file(message, kind: "image", filename: "a#{index}.png")
      end
      holder[:conversation] = conversation
    end

    it "does not grow queries as the gallery grows (F-4)" do
      Settings.fetch(:gallery_page_size)
      expect do
        GalleryPageResource.new(
          described_class.call(conversation: holder.fetch(:conversation), kind: "images")
        ).to_h
      end.to perform_constant_number_of_queries
    end
  end
end
