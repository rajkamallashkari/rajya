require "rails_helper"

# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations -- format matrix
RSpec.describe ExportJobs::Writer do
  def populated_job(format:, include_media: false)
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    conversation.update!(title: "Cafe")
    message = create(:message, conversation: conversation, sender_account: user.account, body: "Hi <there>")
    create(:message_location, message: message, label: "Gate")
    create(:message_contact, message: message, display_name: "Priya")
    tombstone = create(:message, conversation: conversation, sender_account: user.account, body: "gone")
    tombstone.update!(deleted_at: Time.current)
    image = create(:attachment, message: message, kind: "image", content_type: "image/png")
    image.file.attach(io: StringIO.new("PNG"), filename: "p.png", content_type: "image/png")
    create(:attachment, message: message, kind: "file", content_type: "application/pdf")
    create(:export_job, account: user.account, conversation: conversation, format: format, include_media: include_media)
  end

  it "renders json, txt, and html projections without inventing positions (S-23)" do
    json_body, json_name, json_type = described_class.call(job: populated_job(format: "json"))
    expect(json_name).to end_with(".json")
    expect(json_type).to eq("application/json")
    parsed = JSON.parse(json_body)
    expect(parsed.fetch("conversations").sole.fetch("title")).to eq("Cafe")
    expect(parsed.dig("conversations", 0, "messages").first).to include("body" => "Hi <there>")
    expect(parsed.dig("conversations", 0, "messages").first.fetch("location")).to include("label" => "Gate")
    expect(parsed.dig("conversations", 0, "messages").last.fetch("deleted")).to be(true)

    txt_body, = described_class.call(job: populated_job(format: "txt"))
    expect(txt_body).to include("Cafe")
    expect(txt_body).to include("Hi <there>")

    html_body, = described_class.call(job: populated_job(format: "html"))
    expect(html_body).to include("Cafe")
    expect(html_body).to include("Hi &lt;there&gt;")
  end

  it "embeds image bytes when include_media is set" do
    json_body, = described_class.call(job: populated_job(format: "json", include_media: true))
    parsed = JSON.parse(json_body)
    expect(parsed.dig("conversations", 0, "messages", 0, "attachments", 0, "data")).to eq(Base64.strict_encode64("PNG"))

    html_body, = described_class.call(job: populated_job(format: "html", include_media: true))
    expect(html_body).to include("data:image/png;base64,")
  end

  it "falls back to a conversation id title when the group has none" do
    user = create(:user)
    conversation = create_direct_between(user.account, create(:account))
    create(:message, conversation: conversation, sender_account: user.account)
    job = create(:export_job, account: user.account, conversation: conversation, format: "txt")

    body, = described_class.call(job: job)

    expect(body).to include("conversation-#{conversation.id}")
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
