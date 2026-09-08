module CallHelpers
  def enable_webrtc_calls!
    FeatureFlag.find_or_initialize_by(key: "webrtc_calls").tap do |flag|
      flag.description = FeatureFlagRegistry.description_for(:webrtc_calls)
      flag.enabled = true
      flag.save!
    end
  end

  def capture_cable
    captured = []
    allow(ActionCable.server).to receive(:broadcast) { |stream, payload| captured << { stream: stream, payload: payload } }
    captured
  end

  def add_call_participants(call, *accounts)
    accounts.each { |account| create(:call_participant, call: call, account: account, status: "left") }
  end

  def create_direct_call_log(initiator, peer: create(:account), status: :ended, created_at: Time.current)
    conversation = create_direct_between(initiator, peer)
    call = create(:call, status, conversation: conversation, initiator_account: initiator, created_at: created_at)
    add_call_participants(call, *conversation.accounts)
    call
  end
end
