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
      capacity_alert_cooldown: {
        type: :integer, category: :media, default: 86_400, min: 60, max: 604_800,
        description: "Seconds between repeated admin capacity alert emails (S-5)."
      },
      export_artefact_ttl: {
        type: :integer, category: :media, default: 604_800, min: 60, max: 2_592_000,
        description: "Seconds an export artefact remains downloadable (NR-32, 7 days)."
      },
      gallery_page_size: {
        type: :integer, category: :media, default: 30, min: 1, max: 100,
        description: "Items per page in the per-conversation media/files/links gallery."
      },
      gif_search_limit: {
        type: :integer, category: :media, default: 16, min: 1, max: 50,
        description: "Maximum Tenor GIF search results returned by the proxy (NR-29)."
      },
      location_tile_request_cap: {
        type: :integer, category: :media, default: 8, min: 1, max: 32,
        description: "Maximum OpenStreetMap tile requests a client may make (NR-30)."
      },
      osm_tile_host: {
        type: :string, category: :media, default: "tile.openstreetmap.org",
        description: "OpenStreetMap tile host for static location cards (NR-30)."
      },
      osm_tile_size: {
        type: :integer, category: :media, default: 256, min: 64, max: 512,
        description: "Pixel size of one OpenStreetMap tile (NR-30)."
      },
      osm_tile_zoom: {
        type: :integer, category: :media, default: 15, min: 1, max: 19,
        description: "Zoom level for static location-card tiles (NR-30)."
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
        type: :string, category: :calls, default: "640x480",
        description: "Group-video resolution cap for mesh bandwidth (BR-111)."
      },
      group_video_frame_rate: {
        type: :integer, category: :calls, default: 20, min: 1, max: 60,
        description: "Group-video frame-rate cap for mesh bandwidth (BR-111)."
      },
      ice_restart_max_attempts: {
        type: :integer, category: :calls, default: 3, min: 1, max: 10,
        description: "ICE restarts per peer before the call is dropped (F-32)."
      },
      stun_urls: {
        type: :array, category: :calls,
        default: %w[stun:stun.l.google.com:19302 stun:stun1.l.google.com:19302 stun:stun2.l.google.com:19302],
        description: "STUN URLs always offered to WebRTC clients (BR-71)."
      },
      turn_port: {
        type: :integer, category: :calls, default: 443, min: 1, max: 65_535,
        description: "coturn listening port for HMAC TURN URLs (BR-71)."
      },
      turn_credential_ttl: {
        type: :integer, category: :calls, default: 86_400, min: 60, max: 604_800,
        description: "Seconds a coturn HMAC username remains valid (BR-71)."
      },
      metered_ice_timeout: {
        type: :integer, category: :calls, default: 3, min: 1, max: 15,
        description: "Seconds to wait for Metered TURN credentials before STUN-only."
      },
      metered_ice_cache_ttl: {
        type: :integer, category: :calls, default: 14_400, min: 60, max: 86_400,
        description: "Seconds to cache a successful Metered TURN response."
      },

      # --- ai (BR-74, BR-75, BR-80, BR-84, NR-8, D-3) ---
      ai_bot_reply_models: {
        type: :array, category: :ai,
        default: %w[groq/llama-3.3-70b-versatile groq/llama-3.1-8b-instant gemini/gemini-2.5-flash ollama/llama3.2],
        description: "Ordered bot_reply models provider/model (NR-8, TARGET §6.3)."
      },
      ai_cancel_ttl: {
        type: :integer, category: :ai, default: 300, min: 30, max: 3_600,
        description: "Seconds a stream-cancel flag remains set (BR-79 unified)."
      },
      ai_context_window: {
        type: :integer, category: :ai, default: 20, min: 1, max: 200,
        description: "Prior messages included in a bot context window (BR-74)."
      },
      ai_embedding_models: {
        type: :array, category: :ai, default: %w[ollama/nomic-embed-text],
        description: "Ordered embedding models; Ollama is the floor (D-3)."
      },
      ai_fallback_attempt_cap: {
        type: :integer, category: :ai, default: 2, min: 0, max: 10,
        description: "Fallback provider attempts after the primary fails."
      },
      ai_image_gen_models: {
        type: :array, category: :ai, default: [],
        description: "Ordered image_gen models; unconfigured until NR-F3."
      },
      ai_max_tokens: {
        type: :integer, category: :ai, default: 1_024, min: 16, max: 8_192,
        description: "Completion token cap sent to chat providers (BR-74)."
      },
      ai_memory_extract_max: {
        type: :integer, category: :ai, default: 5, min: 1, max: 20,
        description: "Maximum facts extracted from one user message into bot memory (NR-11)."
      },
      ai_memory_top_k: {
        type: :integer, category: :ai, default: 8, min: 1, max: 50,
        description: "Memories retrieved per bot reply (NR-11)."
      },
      ai_prompt_minimum_length: {
        type: :integer, category: :ai, default: 80, min: 1, max: 10_000,
        description: "Minimum characters before a rewrite/summarize request is accepted (BR-80)."
      },
      ai_rate_limit_per_capability: {
        type: :integer, category: :ai, default: 30, min: 1, max: 1_000,
        description: "Fallback per-account per-capability AI requests per window (BR-84)."
      },
      ai_rate_limit_period: {
        type: :integer, category: :ai, default: 60, min: 1, max: 86_400,
        description: "Seconds in the default AI rate-limit window (BR-84)."
      },
      ai_rate_limit_rewrite: {
        type: :integer, category: :ai, default: 10, min: 1, max: 1_000,
        description: "Rewrite requests per account per window (BR-84)."
      },
      ai_rate_limit_style_profile: {
        type: :integer, category: :ai, default: 1, min: 1, max: 1_000,
        description: "Style-profile builds per account per style-profile window (BR-84)."
      },
      ai_rate_limit_style_profile_period: {
        type: :integer, category: :ai, default: 3_600, min: 60, max: 86_400,
        description: "Seconds in the style-profile rate-limit window (BR-84, 1 hour)."
      },
      ai_rate_limit_suggest_replies: {
        type: :integer, category: :ai, default: 10, min: 1, max: 1_000,
        description: "Smart-reply requests per account per window (BR-84)."
      },
      ai_rate_limit_summarize: {
        type: :integer, category: :ai, default: 5, min: 1, max: 1_000,
        description: "Summarize requests per account per window (BR-84)."
      },
      ai_rate_limit_translate: {
        type: :integer, category: :ai, default: 20, min: 1, max: 1_000,
        description: "Translate requests per account per window (BR-84)."
      },
      ai_reply_rate_limit: {
        type: :integer, category: :ai, default: 20, min: 1, max: 1_000,
        description: "Per-account bot-reply generations per window (F-12)."
      },
      ai_reply_retry_attempts: {
        type: :integer, category: :ai, default: 3, min: 1, max: 10,
        description: "Bot-reply job retries after an upstream failure (BR-78)."
      },
      ai_rewrite_chip_count: {
        type: :integer, category: :ai, default: 3, min: 1, max: 8,
        description: "Follow-up tone chips returned with a rewrite."
      },
      ai_rewrite_models: {
        type: :array, category: :ai, default: %w[groq/llama-3.1-8b-instant ollama/llama3.2],
        description: "Ordered rewrite models provider/model (NR-8)."
      },
      ai_stream_timeout: {
        type: :integer, category: :ai, default: 60, min: 5, max: 300,
        description: "Seconds before an AI stream is aborted."
      },
      ai_style_profile_max_length: {
        type: :integer, category: :ai, default: 300, min: 40, max: 2_000,
        description: "Maximum characters stored in a learned style-profile blob."
      },
      ai_style_profile_min_messages: {
        type: :integer, category: :ai, default: 10, min: 1, max: 500,
        description: "Minimum sent messages before a style profile can be built."
      },
      ai_style_profile_models: {
        type: :array, category: :ai, default: %w[groq/llama-3.1-8b-instant ollama/llama3.2],
        description: "Ordered style_profile models provider/model (NR-8)."
      },
      ai_style_profile_rebuild_threshold: {
        type: :integer, category: :ai, default: 50, min: 1, max: 10_000,
        description: "New sent messages required before a style profile rebuild."
      },
      ai_style_profile_sample: {
        type: :integer, category: :ai, default: 80, min: 1, max: 500,
        description: "Messages sampled when building a style profile (F-11)."
      },
      ai_suggest_replies_count: {
        type: :integer, category: :ai, default: 3, min: 1, max: 8,
        description: "Smart-reply chips returned per request (BR-84)."
      },
      ai_suggest_replies_models: {
        type: :array, category: :ai, default: %w[groq/llama-3.1-8b-instant ollama/llama3.2],
        description: "Ordered suggest_replies models provider/model (NR-8)."
      },
      ai_summarization_threshold: {
        type: :integer, category: :ai, default: 40, min: 2, max: 500,
        description: "Unread count that unlocks summarization (BR-75)."
      },
      ai_summarize_models: {
        type: :array, category: :ai,
        default: %w[groq/llama-3.3-70b-versatile gemini/gemini-2.5-flash ollama/llama3.2],
        description: "Ordered summarize models provider/model (NR-8)."
      },
      ai_temperature: {
        type: :float, category: :ai, default: 0.9, min: 0, max: 2,
        description: "Sampling temperature sent to chat providers."
      },
      ai_transcribe_models: {
        type: :array, category: :ai, default: [ "groq/whisper-large-v3" ],
        description: "Ordered transcribe models (provider/model) for voice notes (NR-33)."
      },
      ai_translate_models: {
        type: :array, category: :ai, default: %w[groq/llama-3.1-8b-instant ollama/llama3.2],
        description: "Ordered translate models provider/model (NR-8)."
      },
      ai_vision_models: {
        type: :array, category: :ai, default: [],
        description: "Ordered vision models; unconfigured until NR-F2."
      },
      gemini_api_key: {
        type: :string, category: :ai, default: "",
        description: "Google AI Studio API key; blank skips Gemini in the chain (D-3)."
      },
      gemini_generate_path: {
        type: :string, category: :ai, default: "/v1beta/models/%{model}:generateContent",
        description: "Gemini generateContent path template with %{model}."
      },
      gemini_host: {
        type: :string, category: :ai, default: "generativelanguage.googleapis.com",
        description: "Google AI Studio / Gemini API host."
      },
      groq_api_key: {
        type: :string, category: :ai, default: "",
        description: "Groq API key for chat and whisper; blank skips Groq (D-3, NR-33)."
      },
      groq_chat_path: {
        type: :string, category: :ai, default: "/openai/v1/chat/completions",
        description: "Groq OpenAI-compatible chat completions path."
      },
      groq_host: {
        type: :string, category: :ai, default: "api.groq.com",
        description: "Groq API host for chat and whisper (D-3, NR-33)."
      },
      groq_transcribe_path: {
        type: :string, category: :ai, default: "/openai/v1/audio/transcriptions",
        description: "Groq whisper transcription path (NR-33)."
      },
      ollama_base_url: {
        type: :string, category: :ai, default: "http://ollama:11434",
        description: "Ollama base URL; Compose service name is the floor (D-3)."
      },
      ollama_chat_path: {
        type: :string, category: :ai, default: "/api/chat",
        description: "Ollama chat path."
      },
      ollama_embed_path: {
        type: :string, category: :ai, default: "/api/embed",
        description: "Ollama embeddings path."
      },
      openrouter_api_key: {
        type: :string, category: :ai, default: "",
        description: "Optional OpenRouter key; blank keeps OpenRouter out of the chain."
      },
      openrouter_chat_path: {
        type: :string, category: :ai, default: "/api/v1/chat/completions",
        description: "OpenRouter chat completions path."
      },
      openrouter_host: {
        type: :string, category: :ai, default: "openrouter.ai",
        description: "OpenRouter API host (optional breadth provider)."
      },
      openrouter_http_referer: {
        type: :string, category: :ai, default: "https://rajya.pages.dev",
        description: "OpenRouter HTTP-Referer header."
      },
      openrouter_title: {
        type: :string, category: :ai, default: "Rajya",
        description: "OpenRouter X-Title header."
      },
      transcribe_retry_attempts: {
        type: :integer, category: :ai, default: 2, min: 1, max: 10,
        description: "Retries for unexpected transcription job errors before a visible fail (NR-33)."
      },

      # --- notifications (BR-98, BR-99, BR-103) ---
      notification_cascade_defaults: {
        type: :object, category: :notifications,
        default: {
          "level" => "all",
          "show_preview" => true,
          "sound" => true,
          "vibration" => true,
          "dnd_enabled" => false,
          "dnd_start" => "22:00",
          "dnd_end" => "07:00",
          "dnd_days" => [ 0, 1, 2, 3, 4, 5, 6 ]
        },
        description: "Code-defined notification cascade defaults (BR-98, BR-99); never stored on the preferences row."
      },
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
      },
      search_snippet_radius: {
        type: :integer, category: :search, default: 60, min: 1, max: 500,
        description: "Characters of context around a search hit in the snippet."
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
