require "rails_helper"

RSpec.describe Auth::RequestContext do
  after { described_class.reset }

  it "holds request-scoped ip and user agent" do
    described_class.ip = "127.0.0.1"
    described_class.user_agent = "RajyaSpec/1.0"

    expect(described_class.ip).to eq("127.0.0.1")
    expect(described_class.user_agent).to eq("RajyaSpec/1.0")
  end
end
