require "rails_helper"

RSpec.describe Auth::Session do
  after { Auth::RequestContext.reset }

  it "returns the user and account on the payload" do
    user = create(:user)
    payload = described_class.issue(user)

    expect(payload.user).to eq(user)
    expect(payload.account).to eq(user.account)
  end

  it "embeds the session jti in the JWT and persists a usable row" do
    user = create(:user)
    payload = described_class.issue(user)
    decoded = Auth::Token.decode(payload.token)
    row = ::Session.find_by!(jti: decoded.fetch("jti"))

    expect(decoded["sub"]).to eq(user.id)
    expect(row.user).to eq(user)
    expect(row).to be_usable
  end

  it "copies user agent and ip from Auth::RequestContext" do
    user = create(:user)
    Auth::RequestContext.user_agent = "RajyaSpec/2.0"
    Auth::RequestContext.ip = "10.0.0.8"
    described_class.issue(user)
    row = user.sessions.last

    expect(row.user_agent).to eq("RajyaSpec/2.0")
    expect(row.ip.to_s).to eq("10.0.0.8")
  end

  it "prefers explicit device metadata over RequestContext" do
    user = create(:user)
    Auth::RequestContext.user_agent = "ignored"
    Auth::RequestContext.ip = "9.9.9.9"
    described_class.issue(user, device_label: "Phone", user_agent: "explicit", ip: "1.1.1.1")
    row = user.sessions.last

    expect(row.device_label).to eq("Phone")
    expect(row.user_agent).to eq("explicit")
    expect(row.ip.to_s).to eq("1.1.1.1")
  end
end
