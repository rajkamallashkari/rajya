require "rails_helper"

RSpec.describe Whatsapp::Payload do
  it "extracts sender and body from a Cloud API envelope" do
    json = JSON.parse(whatsapp_inbound(from: "15551230000", text: " 999111 "))
    messages = described_class.messages(json)

    expect(messages.map { |m| [ m.sender, m.body ] }).to eq([ [ "15551230000", "999111" ] ])
  end

  def blank_payloads
    [
      nil,
      "nope",
      { "entry" => nil },
      { "entry" => [ nil, { "changes" => nil } ] },
      { "entry" => [ { "changes" => [ nil, { "value" => nil } ] } ] },
      { "entry" => [ { "changes" => [ { "value" => { "messages" => nil } } ] } ] },
      { "entry" => [ { "changes" => [ { "value" => { "messages" => [ nil, {} ] } } ] } ] },
      { "entry" => [ { "changes" => [ { "value" => { "messages" => [ { "from" => "", "body" => "x" } ] } } ] } ] },
      { "entry" => [ { "changes" => [ { "value" => { "messages" => [ { "from" => "1", "text" => "x" } ] } } ] } ] }
    ]
  end

  it "skips malformed entries, changes, and messages" do
    expect(blank_payloads.map { |payload| described_class.messages(payload) }).to all(eq([]))
  end

  it "reads a body field when present" do
    payload = { "entry" => [ { "changes" => [ { "value" => { "messages" => [ { "from" => "1", "body" => "code" } ] } } ] } ] }

    expect(described_class.messages(payload).first.body).to eq("code")
  end
end
