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
end
