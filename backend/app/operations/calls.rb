module Calls
  Envelope = Struct.new(:call, :ice_servers, keyword_init: true)
  IceConfig = Struct.new(:ice_servers, keyword_init: true)

  SIGNALING_EVENTS = %w[
    answer
    busy
    call_accepted
    call_cancelled
    call_declined
    call_dismissed
    call_ended
    call_missed
    ice_candidate
    incoming_call
    mute_state
    offer
    screen_share
    user_joined
    user_left
  ].freeze
end
