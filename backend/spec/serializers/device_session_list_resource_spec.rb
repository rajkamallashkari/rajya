require "rails_helper"

RSpec.describe DeviceSessionListResource do
  it "nests device sessions with the current flag" do
    session = create(:session)
    json = described_class.new(Sessions::List.new(sessions: [ session ], current_jti: session.jti)).to_h

    expect(json.fetch("sessions").first.fetch("id")).to eq(session.id)
    expect(json.fetch("sessions").first.fetch("current")).to be(true)
  end
end
