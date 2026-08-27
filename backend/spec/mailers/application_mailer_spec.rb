require "rails_helper"

RSpec.describe ApplicationMailer do
  it "reads the from address from Settings and uses the mailer layout" do
    expect(described_class.default_from_address).to include(Settings.fetch(:email_from_address))
    expect(described_class._layout).to eq("mailer")
  end
end
