require "rails_helper"

RSpec.describe Whatsapp::Reply do
  it "no-ops when the cloud token or destination is blank" do
    expect(described_class.verified("1555")).to be_nil
    create(:app_setting, key: "whatsapp_cloud_token", value: "tok", category: "auth")
    expect(described_class.verified("")).to be_nil
    expect(described_class.verified("1555")).to eq(Catalog.t("whatsapp.verified"))
  end
end
