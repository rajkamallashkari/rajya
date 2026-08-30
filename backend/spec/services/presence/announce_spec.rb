require "rails_helper"

RSpec.describe Presence::Announce do
  def captured
    @captured ||= []
  end

  before do
    allow(ActionCable.server).to receive(:broadcast) do |stream, payload|
      captured << { stream: stream, payload: payload }
    end
  end

  it "always publishes to the subject and to allowed viewers" do
    owner = create(:user)
    peer = create(:user)

    described_class.call(account: owner.account, online: true)

    streams = captured.map { |row| row.fetch(:stream) }
    expect(streams).to contain_exactly(
      Realtime.presence_stream(owner.account.id),
      Realtime.presence_stream(peer.account.id)
    )
  end

  it "still publishes to the subject when last_active is off" do
    owner = create(:user)
    create(:user)
    create(:preference, account: owner.account, data: { "privacy" => { "last_active" => false } })

    described_class.call(account: owner.account, online: false)

    expect(captured.map { |row| row.fetch(:stream) })
      .to eq([ Realtime.presence_stream(owner.account.id) ])
  end
end
