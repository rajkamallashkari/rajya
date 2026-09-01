# frozen_string_literal: true

module PreservationWalk
  DOCS = Rails.root.join("..", "docs").expand_path
  FRONTEND = Rails.root.join("..", "frontend", "src").expand_path

  SCHEMA_TABLE = {
    messaging: %i[
      message_edit_window pins_per_conversation attachments_per_message
      reply_quote_length message_page_size jump_window client_cache_size
      unsend_window max_message_length pinned_conversations_cap multi_select_cap
    ],
    groups: %i[
      min_members max_members invite_token_ttl invite_max_uses_ceiling
      join_request_expiry slow_mode_presets
    ],
    media: %i[
      file_caps user_quota_bytes global_quota_bytes signed_url_ttl
      voice_note_max_seconds waveform_peak_count image_variant_dimensions
      capacity_alert_threshold export_artefact_ttl
    ],
    calls: %i[
      ring_timeout call_heartbeat_timeout call_heartbeat_interval
      call_sweep_interval mesh_participant_cap group_video_resolution
      group_video_frame_rate ice_restart_max_attempts
    ],
    ai: %i[
      ai_context_window ai_summarization_threshold ai_prompt_minimum_length
      ai_rate_limit_per_capability ai_reply_rate_limit ai_memory_top_k
      ai_stream_timeout ai_fallback_attempt_cap
    ],
    notifications: %i[push_ttl fanout_batch_size notification_retry_policy digest_window],
    realtime: %i[
      typing_throttle typing_key_ttl presence_ttl reconnect_delay
      receipt_debounce poll_interval
    ],
    auth: %i[
      otp_length otp_expiry magic_link_ttl session_lifetime app_lock_threshold
      rate_limit_login_attempts rate_limit_messages rate_limit_api_general
    ],
    moderation: %i[report_reasons auto_flag_threshold report_cooldown],
    search: %i[search_min_query_length search_debounce search_page_size]
  }.freeze

  GAPS = [ 20, 97 ].freeze
  CUT_NRS = [ 16, 17 ].freeze
  NRF_SEAMS = {
    1 => "style_profile",
    2 => "images:",
    3 => "generate_image",
    5 => "reply_to_message_id",
    7 => "message_locations",
    8 => "export_jobs"
  }.freeze
end
