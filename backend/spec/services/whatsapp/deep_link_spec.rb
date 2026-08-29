require "rails_helper"

RSpec.describe Whatsapp::DeepLink do
  it "builds a wa.me URL when a business number is configured" do
    configure_whatsapp!(number: "15551234567")

    expect(described_class.wa_url("123456")).to eq("https://wa.me/15551234567?text=123456")
  end

  it "returns nil when the number or code is blank" do
    configure_whatsapp!(number: "")
    expect(described_class.wa_url("123456")).to be_nil
    configure_whatsapp!(number: "1555")
    expect(described_class.wa_url("")).to be_nil
  end
end
