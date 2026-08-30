# SCHEMA_DESIGN.md §8 constants table — every row is a registry entry in P0
# so later phases read Settings.fetch rather than a literal the CI guard will
# reject. Units are in each description. Numeric defaults live here (app/lib),
# not in operations/models.
module Settings
  module Registry
    ENTRIES = {
      # --- messaging (BR-2, BR-16, BR-21, BR-107, BR-108) ---
      message_edit_window: {
        type: :integer, category: :messaging, default: 900, min: 1, max: 86_400,
        description: "Seconds after send during which the sender may edit (BR-2, 15 min)."
      },
      pins_per_conversation: {
        type: :integer, category: :messaging, default: 5, min: 1, max: 100,
        description: "Maximum pinned messages per conversation (BR-21)."
      },
      attachments_per_message: {
        type: :integer, category: :messaging, default: 10, min: 1, max: 50,
        description: "Maximum attachments on one message (BR-16)."
      },
      reply_quote_length: {
        type: :integer, category: :messaging, default: 120, min: 1, max: 2_000,
        description: "Characters of the parent body shown in a reply quote."
      },
      message_page_size: {
        type: :integer, category: :messaging, default: 50, min: 1, max: 200,
        description: "Messages per cursor page (BR-108)."
      },
      jump_window: {
        type: :integer, category: :messaging, default: 60, min: 1, max: 500,
        description: "Messages loaded around a jump-to-message target."
      },
      client_cache_size: {
        type: :integer, category: :messaging, default: 200, min: 10, max: 5_000,
        description: "Client-side cached messages per conversation (BR-107)."
      },
      unsend_window: {
        type: :integer, category: :messaging, default: nil, min: 1, max: 86_400, allow_nil: true,
        description: "Seconds after send during which unsend is allowed; null means no time limit (BR-1)."
      },
      max_message_length: {
        type: :integer, category: :messaging, default: 4_096, min: 1, max: 65_536,
        description: "Maximum body length in characters."
      },
      reaction_emoji_max_length: {
        type: :integer, category: :messaging, default: 16, min: 1, max: 64,
        description: "Maximum characters in a reaction emoji string (BR-25)."
      },
      rrule_count_max: {
        type: :integer, category: :messaging, default: 365, min: 1, max: 10_000,
        description: "Maximum COUNT in a scheduled-message RRULE subset (NR-26)."
      },
      rrule_interval_max: {
        type: :integer, category: :messaging, default: 366, min: 1, max: 10_000,
        description: "Maximum INTERVAL in a scheduled-message RRULE subset (NR-26)."
      },
      pinned_conversations_cap: {
        type: :integer, category: :messaging, default: 10, min: 1, max: 100,
        description: "Maximum conversations a member may pin (NR-21)."
      },
      mute_durations: {
        type: :array, category: :messaging, default: [ 3_600, 28_800, 86_400, 31_536_000 ],
        description: "Allowed mute durations in seconds: 1h, 8h, 24h, until-on (1 year)."
      },
      reminder_note_max_length: {
        type: :integer, category: :messaging, default: 280, min: 1, max: 4_096,
        description: "Maximum characters in a message-reminder note (NR-24)."
      },
      saved_reply_shortcut_max_length: {
        type: :integer, category: :messaging, default: 32, min: 1, max: 64,
        description: "Maximum characters in a saved-reply shortcut (NR-25)."
      },
      multi_select_cap: {
        type: :integer, category: :messaging, default: 100, min: 1, max: 500,
        description: "Maximum messages in one multi-select bulk action (NR-20)."
      },
      contacts_per_message: {
        type: :integer, category: :messaging, default: 10, min: 1, max: 50,
        description: "Maximum contact cards on one message (NR-31)."
      },
      latitude_max: {
        type: :integer, category: :messaging, default: 90, min: 0, max: 90,
        description: "Maximum latitude degrees for a static location (NR-30)."
      },
      latitude_min: {
        type: :integer, category: :messaging, default: -90, min: -90, max: 0,
        description: "Minimum latitude degrees for a static location (NR-30)."
      },
      location_label_max_length: {
        type: :integer, category: :messaging, default: 120, min: 1, max: 500,
        description: "Maximum characters in a location label (NR-30)."
      },
      longitude_max: {
        type: :integer, category: :messaging, default: 180, min: 0, max: 180,
        description: "Maximum longitude degrees for a static location (NR-30)."
      },
      longitude_min: {
        type: :integer, category: :messaging, default: -180, min: -180, max: 0,
        description: "Minimum longitude degrees for a static location (NR-30)."
      },
      poll_max_options: {
        type: :integer, category: :messaging, default: 12, min: 2, max: 50,
        description: "Maximum options on one poll (NR-15)."
      },
      poll_min_options: {
        type: :integer, category: :messaging, default: 2, min: 2, max: 20,
        description: "Minimum options on one poll (NR-15)."
      },
      poll_option_max_length: {
        type: :integer, category: :messaging, default: 100, min: 1, max: 500,
        description: "Maximum characters in a poll option label (NR-15)."
      },
      poll_question_max_length: {
        type: :integer, category: :messaging, default: 256, min: 1, max: 4_096,
        description: "Maximum characters in a poll question (NR-15)."
      },

      # --- groups (BR-53) ---
      folder_name_max_length: {
        type: :integer, category: :groups, default: 50, min: 1, max: 200,
        description: "Maximum characters in a conversation folder name."
      },
      min_members: {
        type: :integer, category: :groups, default: 2, min: 2, max: 10_000,
        description: "Minimum members for a group conversation (BR-53)."
      },
      max_members: {
        type: :integer, category: :groups, default: nil, min: 2, max: 100_000, allow_nil: true,
        description: "Maximum members for a group; null means uncapped."
      },
      mention_everyone_limit: {
        type: :integer, category: :groups, default: 1, min: 1, max: 50,
        description: "Special @everyone/@admins mentions allowed per account per conversation per window (NR-35)."
      },
      mention_everyone_period: {
        type: :integer, category: :groups, default: 300, min: 1, max: 86_400,
        description: "Window in seconds for the @everyone/@admins mention rate limit (NR-35)."
      },
      invite_token_ttl: {
        type: :integer, category: :groups, default: 604_800, min: 60, max: 31_536_000,
        description: "Invite token lifetime in seconds."
      },
      invite_max_uses_ceiling: {
        type: :integer, category: :groups, default: 100, min: 1, max: 100_000,
        description: "Upper bound an admin may set for invite max-uses."
      },
      invite_token_bytes: {
        type: :integer, category: :groups, default: 18, min: 16, max: 32,
        description: "SecureRandom.urlsafe_base64 byte length for invite tokens (BR-57)."
      },
      join_request_expiry: {
        type: :integer, category: :groups, default: 604_800, min: 60, max: 31_536_000,
        description: "Seconds before a pending join request expires."
      },
      slow_mode_presets: {
        type: :array, category: :groups, default: [ 0, 10, 30, 60, 300, 3_600 ],
        description: "Allowed slow-mode intervals in seconds (NR-36)."
      },

      # --- media (BR-18, BR-19, BR-87, BR-88) ---
      file_caps: {
        type: :object, category: :media,
        default: { "image" => 10_485_760, "video" => 104_857_600, "audio" => 52_428_800, "other" => 104_857_600 },
        description: "Per-file byte caps by type (BR-88: image 10 MB, video 100 MB, audio 50 MB, other 100 MB)."
      },
      user_quota_bytes: {
        type: :integer, category: :media, default: 524_288_000, min: 1,
        description: "Per-account storage quota in bytes (BR-87, 500 MB)."
      },
      global_quota_bytes: {
        type: :integer, category: :media, default: 10_200_547_328, min: 1,
        description: "Global storage quota in bytes (9.5 GB R2 free-tier envelope)."
      },
      signed_url_ttl: {
        type: :integer, category: :media, default: 300, min: 30, max: 86_400,
        description: "Signed media URL lifetime in seconds (5 min)."
      },
      voice_note_max_seconds: {
        type: :integer, category: :media, default: 300, min: 1, max: 3_600,
        description: "Maximum voice-note duration in seconds (BR-18, 5 min)."
      },
      waveform_peak_count: {
        type: :integer, category: :media, default: 64, min: 8, max: 512,
        description: "Peaks sampled for a voice-note waveform (BR-19)."
      },
      image_variant_dimensions: {
        type: :object, category: :media, default: { "thumb" => 150, "preview" => 1_280 },
        description: "Longest-edge pixels for generated image variants."
      },
      capacity_alert_threshold: {
        type: :integer, category: :media, default: 80, min: 1, max: 100,
        description: "Percent of bucket capacity that triggers an admin alert (S-5)."
      },
      export_artefact_ttl: {
        type: :integer, category: :media, default: 86_400, min: 60, max: 2_592_000,
        description: "Seconds an export artefact remains downloadable (NR-32)."
      },
      gallery_page_size: {
        type: :integer, category: :media, default: 30, min: 1, max: 100,
        description: "Items per page in the per-conversation media/files/links gallery."
      },
      gif_search_limit: {
        type: :integer, category: :media, default: 16, min: 1, max: 50,
        description: "Maximum Tenor GIF search results returned by the proxy (NR-29)."
      },
      gif_search_min_query_length: {
        type: :integer, category: :media, default: 2, min: 1, max: 10,
        description: "Minimum characters before a GIF search is executed (NR-29)."
      },
      sticker_pack_max_bytes: {
        type: :integer, category: :media, default: 5_242_880, min: 1,
        description: "Maximum total blob bytes in one sticker or emoji pack (NR-28)."
      },
      sticker_pack_max_items: {
        type: :integer, category: :media, default: 80, min: 1, max: 500,
        description: "Maximum stickers or custom emoji in one pack (NR-28)."
      },
      sticker_pack_name_max_length: {
        type: :integer, category: :media, default: 64, min: 1, max: 200,
        description: "Maximum characters in a sticker pack name (NR-28)."
      },
      sticker_pack_slug_max_length: {
        type: :integer, category: :media, default: 48, min: 1, max: 80,
        description: "Maximum characters in a sticker pack slug (NR-28)."
      },
      sticker_shortcode_max_length: {
        type: :integer, category: :media, default: 32, min: 1, max: 64,
        description: "Maximum characters in a sticker or custom-emoji shortcode (NR-28)."
      },
      sticker_storage_max_bytes: {
        type: :integer, category: :media, default: 52_428_800, min: 1,
        description: "Maximum sticker/emoji bytes per owner, or across all system packs (NR-28, S-19)."
      },
      tenor_api_key: {
        type: :string, category: :media, default: "",
        description: "Tenor API key for the server-side GIF proxy; blank disables search (NR-29)."
      },
      tenor_client_key: {
        type: :string, category: :media, default: "rajya",
        description: "Tenor client_key sent with GIF search requests (NR-29)."
      },
      tenor_host: {
        type: :string, category: :media, default: "tenor.googleapis.com",
        description: "Tenor API host for the GIF proxy (NR-29)."
      },
      blocked_upload_extensions: {
        type: :array, category: :media,
        default: %w[
          .apk .app .bat .cmd .com .deb .dmg .exe .ipa .jar .msi .pkg .ps1
          .rpm .scr .sh .vbs .wsf
        ],
        description: "Filename extensions rejected at presign (BR-89)."
      },
      blocked_mime_prefixes: {
        type: :array, category: :media,
        default: %w[
          application/x-executable
          application/x-msdownload
          application/x-msdos-program
        ],
        description: "MIME prefixes rejected at presign and after magic-byte sniffing (BR-89)."
      },
      blurhash_x_components: {
        type: :integer, category: :media, default: 4, min: 1, max: 9,
        description: "Horizontal BlurHash components for image placeholders."
      },
      blurhash_y_components: {
        type: :integer, category: :media, default: 3, min: 1, max: 9,
        description: "Vertical BlurHash components for image placeholders."
      },
      image_variant_quality: {
        type: :object, category: :media, default: { "thumb" => 75, "preview" => 80 },
        description: "WebP quality for generated image variants."
      },
      link_preview_blob_prefix: {
        type: :string, category: :media, default: "link_previews/",
        description: "Active Storage key prefix excluded from orphan blob cleanup (BR-95)."
      },
      media_process_retry_attempts: {
        type: :integer, category: :media, default: 3, min: 1, max: 10,
        description: "Retries for transient attachment processing failures (F-17)."
      },
      orphan_blob_max_age: {
        type: :integer, category: :media, default: 3_600, min: 60, max: 86_400,
        description: "Seconds before an unattached blob is treated as orphaned (BR-95)."
      },

      # --- calls (BR-62, BR-64, BR-111) ---
      ring_timeout: {
        type: :integer, category: :calls, default: 45, min: 5, max: 180,
        description: "Seconds before an unanswered ring becomes missed (BR-64)."
      },
      call_heartbeat_timeout: {
        type: :integer, category: :calls, default: 90, min: 10, max: 600,
        description: "Seconds without a heartbeat before a call participant is dropped."
      },
      call_heartbeat_interval: {
        type: :integer, category: :calls, default: 20, min: 5, max: 120,
        description: "Seconds between call heartbeats."
      },
      call_sweep_interval: {
        type: :integer, category: :calls, default: 30, min: 5, max: 300,
        description: "Seconds between sweeps for stale call participants."
      },
      mesh_participant_cap: {
        type: :integer, category: :calls, default: 4, min: 2, max: 8,
        description: "Maximum humans in a mesh call (BR-62)."
      },
      group_video_resolution: {
        type: :string, category: :calls, default: "720p",
        description: "Default group-video resolution (BR-111)."
      },
      group_video_frame_rate: {
        type: :integer, category: :calls, default: 30, min: 1, max: 60,
        description: "Default group-video frame rate (BR-111)."
      },

      # --- ai (BR-74, BR-75, BR-80, BR-84) ---
      ai_context_window: {
        type: :integer, category: :ai, default: 20, min: 1, max: 200,
        description: "Prior messages included in a bot context window (BR-74)."
      },
      ai_summarization_threshold: {
        type: :integer, category: :ai, default: 40, min: 2, max: 500,
        description: "Unread count that unlocks summarization (BR-75)."
      },
      ai_prompt_minimum_length: {
        type: :integer, category: :ai, default: 80, min: 1, max: 10_000,
        description: "Minimum characters before a rewrite/summarize request is accepted (BR-80)."
      },
      ai_rate_limit_per_capability: {
        type: :integer, category: :ai, default: 30, min: 1, max: 1_000,
        description: "Per-account per-capability AI requests per window (BR-84)."
      },
      ai_reply_rate_limit: {
        type: :integer, category: :ai, default: 20, min: 1, max: 1_000,
        description: "Per-account bot-reply generations per window."
      },
      ai_memory_top_k: {
        type: :integer, category: :ai, default: 8, min: 1, max: 50,
        description: "Memories retrieved per bot reply (NR-11)."
      },
      ai_stream_timeout: {
        type: :integer, category: :ai, default: 60, min: 5, max: 300,
        description: "Seconds before an AI stream is aborted."
      },
      ai_fallback_attempt_cap: {
        type: :integer, category: :ai, default: 2, min: 0, max: 10,
        description: "Fallback provider attempts after the primary fails."
      },

      # --- notifications (BR-103) ---
      push_ttl: {
        type: :integer, category: :notifications, default: 86_400, min: 60, max: 604_800,
        description: "Web Push TTL in seconds (BR-103, 24 h)."
      },
      fanout_batch_size: {
        type: :integer, category: :notifications, default: 100, min: 1, max: 1_000,
        description: "Push/fanout jobs processed per batch."
      },
      notification_retry_policy: {
        type: :object, category: :notifications,
        default: { "max_attempts" => 3, "backoff_seconds" => [ 10, 60, 300 ] },
        description: "Retry attempts and backoff for failed push delivery."
      },
      digest_window: {
        type: :integer, category: :notifications, default: 3_600, min: 60, max: 86_400,
        description: "Seconds of activity collapsed into one digest notification."
      },

      # --- realtime (BR-109, BR-110) ---
      typing_throttle: {
        type: :integer, category: :realtime, default: 3, min: 1, max: 30,
        description: "Seconds between typing-indicator broadcasts."
      },
      typing_key_ttl: {
        type: :integer, category: :realtime, default: 5, min: 1, max: 60,
        description: "Seconds a typing key remains set after the last keystroke."
      },
      presence_ttl: {
        type: :integer, category: :realtime, default: 300, min: 15, max: 3_600,
        description: "Seconds before presence expires without a heartbeat."
      },
      last_active_debounce: {
        type: :integer, category: :realtime, default: 30, min: 1, max: 3_600,
        description: "Seconds between persisted last_active_at writes while still online."
      },
      presence_offline_grace: {
        type: :integer, category: :realtime, default: 5, min: 1, max: 60,
        description: "Seconds after the last disconnect before presence goes offline (BR-44)."
      },
      reconnect_delay: {
        type: :integer, category: :realtime, default: 800, min: 50, max: 30_000,
        description: "Milliseconds before a client reconnects to Cable (BR-110)."
      },
      reconnect_poll: {
        type: :integer, category: :realtime, default: 4_000, min: 500, max: 60_000,
        description: "Milliseconds between Cable reconnect probes when the PWA wakes (BR-110)."
      },
      connection_poll: {
        type: :integer, category: :realtime, default: 3_000, min: 500, max: 60_000,
        description: "Milliseconds between Cable connection health polls (BR-110)."
      },
      receipt_debounce: {
        type: :integer, category: :realtime, default: 400, min: 50, max: 10_000,
        description: "Milliseconds to debounce receipt watermark advances (BR-109)."
      },
      poll_interval: {
        type: :integer, category: :realtime, default: 30, min: 1, max: 300,
        description: "Seconds between client poll fallbacks when Cable is down."
      },

      # --- auth (F-2, TARGET §4.7) ---
      otp_length: {
        type: :integer, category: :auth, default: 6, min: 4, max: 10,
        description: "Digits in an email OTP code."
      },
      otp_expiry: {
        type: :integer, category: :auth, default: 600, min: 30, max: 3_600,
        description: "OTP lifetime in seconds."
      },
      magic_link_ttl: {
        type: :integer, category: :auth, default: 1_800, min: 60, max: 86_400,
        description: "Magic-link lifetime in seconds."
      },
      password_min_length: {
        type: :integer, category: :auth, default: 8, min: 8, max: 128,
        description: "Minimum characters required when setting a password."
      },
      password_reset_ttl: {
        type: :integer, category: :auth, default: 3_600, min: 60, max: 86_400,
        description: "Password-reset token lifetime in seconds."
      },
      username_min_length: {
        type: :integer, category: :auth, default: 3, min: 2, max: 30,
        description: "Minimum username length when deriving a handle from email."
      },
      username_max_length: {
        type: :integer, category: :auth, default: 30, min: 3, max: 64,
        description: "Maximum username length when deriving a handle from email."
      },
      nickname_max_length: {
        type: :integer, category: :auth, default: 64, min: 1, max: 128,
        description: "Maximum characters in a per-contact nickname (NR-41)."
      },
      session_last_seen_granularity: {
        type: :integer, category: :auth, default: 60, min: 1, max: 3_600,
        description: "Minimum seconds between session last-seen writes (NR-44)."
      },
      session_lifetime: {
        type: :integer, category: :auth, default: 2_592_000, min: 300, max: 31_536_000,
        description: "Session/JWT lifetime in seconds."
      },
      app_lock_threshold: {
        type: :integer, category: :auth, default: 60, min: 0, max: 3_600,
        description: "Seconds of backgrounding before App Lock engages."
      },
      webauthn_challenge_ttl: {
        type: :integer, category: :auth, default: 300, min: 30, max: 3_600,
        description: "WebAuthn challenge lifetime in seconds."
      },
      phone_verification_ttl: {
        type: :integer, category: :auth, default: 600, min: 30, max: 3_600,
        description: "WhatsApp click-to-verify code lifetime in seconds (TARGET §4.8, ~10 min)."
      },
      whatsapp_app_secret: {
        type: :string, category: :auth, default: "",
        description: "Meta app secret for X-Hub-Signature-256 on the WhatsApp webhook."
      },
      whatsapp_business_number: {
        type: :string, category: :auth, default: "",
        description: "WhatsApp Business phone number digits for wa.me deep links (NR-9 / D-6)."
      },
      whatsapp_cloud_token: {
        type: :string, category: :auth, default: "",
        description: "WhatsApp Cloud API token for the unbilled verified reply; blank skips the reply."
      },
      whatsapp_webhook_verify_token: {
        type: :string, category: :auth, default: "",
        description: "Token Meta sends as hub.verify_token when subscribing the webhook."
      },
      rate_limit_login_attempts: {
        type: :integer, category: :auth, default: 10, min: 1, max: 100,
        description: "Login attempts allowed per period per IP/account (F-2)."
      },
      rate_limit_login_period: {
        type: :integer, category: :auth, default: 900, min: 30, max: 86_400,
        description: "Login rate-limit window in seconds (15 min)."
      },
      rate_limit_otp_issuance: {
        type: :integer, category: :auth, default: 3, min: 1, max: 50,
        description: "OTP issuance attempts allowed per destination per period."
      },
      rate_limit_otp_issuance_period: {
        type: :integer, category: :auth, default: 900, min: 30, max: 86_400,
        description: "OTP issuance window in seconds (15 min)."
      },
      rate_limit_otp_verification: {
        type: :integer, category: :auth, default: 5, min: 1, max: 50,
        description: "OTP verification attempts per code before it is invalidated."
      },
      rate_limit_registration: {
        type: :integer, category: :auth, default: 5, min: 1, max: 100,
        description: "Registrations allowed per IP per period."
      },
      rate_limit_registration_period: {
        type: :integer, category: :auth, default: 3_600, min: 60, max: 86_400,
        description: "Registration rate-limit window in seconds (1 hour)."
      },
      rate_limit_messages: {
        type: :integer, category: :auth, default: 60, min: 1, max: 1_000,
        description: "Messages allowed per account per minute."
      },
      rate_limit_api_general: {
        type: :integer, category: :auth, default: 300, min: 10, max: 10_000,
        description: "General API requests allowed per account per minute."
      },
      email_provider: {
        type: :string, category: :auth, default: "sendgrid",
        description: "Outbound email provider; local environments deliver to Mailpit regardless."
      },
      email_from_address: {
        type: :string, category: :auth, default: "noreply@rajya.local",
        description: "From address for transactional mail."
      },
      email_from_name: {
        type: :string, category: :auth, default: "Rajya",
        description: "From display name for transactional mail."
      },

      # --- moderation (NR-39) ---
      report_reasons: {
        type: :array, category: :moderation,
        default: %w[spam harassment hate_speech illegal other],
        description: "Selectable reasons when reporting a message or account."
      },
      auto_flag_threshold: {
        type: :integer, category: :moderation, default: 5, min: 1, max: 100,
        description: "Reports on one target that auto-flag it for admin review."
      },
      report_cooldown: {
        type: :integer, category: :moderation, default: 300, min: 0, max: 86_400,
        description: "Seconds before the same account can report the same target again."
      },

      # --- search (BR-112) ---
      search_min_query_length: {
        type: :integer, category: :search, default: 2, min: 1, max: 10,
        description: "Minimum characters before a search is executed (BR-112)."
      },
      search_debounce: {
        type: :integer, category: :search, default: 350, min: 0, max: 5_000,
        description: "Milliseconds to debounce live search input."
      },
      search_page_size: {
        type: :integer, category: :search, default: 25, min: 1, max: 100,
        description: "Search results per page."
      }
    }.freeze

    class << self
      def entries
        ENTRIES
      end

      def keys
        ENTRIES.keys
      end

      def fetch(key, &block)
        ENTRIES.fetch(key, &block)
      end

      def registered?(key)
        ENTRIES.key?(key.to_sym)
      end
    end
  end
end
