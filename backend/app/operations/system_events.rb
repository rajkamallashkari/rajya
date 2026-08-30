# Closed set of `messages.system_event` values (SCHEMA §4, NR-4).
# `disappearing_timer_changed` was cut with NR-16.
module SystemEvents
  EVENTS = %w[
    member_added
    member_removed
    member_left
    member_joined
    title_changed
    description_changed
    avatar_changed
    role_changed
    message_pinned
    message_unpinned
    call_started
    call_ended
    call_missed
    conversation_created
    permissions_changed
    slow_mode_changed
    forwarding_restricted
    forwarding_unrestricted
  ].freeze
end
