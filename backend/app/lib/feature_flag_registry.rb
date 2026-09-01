# Code-defined defaults for every flag that existed in
# legacy/cognify/config/feature_flags.yml — production values, so nothing
# that was live is dropped (MASTER_PLAN.md session 0.3). Unregistered keys
# raise in development/test and fail closed (false) in production.
module FeatureFlagRegistry
  UnregisteredKey = Class.new(StandardError)

  # Production YAML enabled these; the rest stay at the file-wide default of false.
  PRODUCTION_ENABLED = %i[
    ai_rewrite
    ai_smart_reply
    ai_summarize
    ai_translate
    app_lock
    async_bot_replies
    bot_builder
    direct_uploads
    email_password_auth
    link_previews
    media_attachments
    notification_preferences
    passkey_auth
    passwordless_auth
    phone_auth
    unified_identity
    voice_notes
    voice_transcription
  ].freeze

  DESCRIPTIONS = {
    async_bot_replies: "Move AI generation to a background job.",
    direct_uploads: "Browser-direct-to-R2 presigned uploads.",
    unified_identity: "Single accounts table as the participant identity.",
    bot_builder: "User-facing bot builder UI.",
    email_password_auth: "Classic email+password login.",
    passwordless_auth: "Email OTP and magic link.",
    passkey_auth: "WebAuthn biometric passkeys.",
    app_lock: "Client-side biometric App Lock overlay.",
    phone_auth: "Phone verification (WhatsApp click-to-verify).",
    group_rbac: "Owner/admin/member roles and invite links.",
    broadcast_channels: "Admin-post channel conversations.",
    chat_folders: "Custom conversation folders.",
    history_driven_ui: "Viewport-aware pushState navigation.",
    virtualized_feed: "Virtualized message list with cursor pagination.",
    mutation_sync: "Catch-up on reconnect via revision watermarks.",
    notification_preferences: "Hierarchical push preferences and DND.",
    link_previews: "Server-side OpenGraph link unfurling.",
    media_attachments: "File, image and voice attachments.",
    voice_notes: "Mic recorder with waveform upload.",
    edit_messages: "Edit sent messages within the edit window.",
    delete_for_everyone: "Unsend (soft-delete) a message for everyone.",
    read_receipts: "Granular read-receipt watermarks.",
    saved_messages: "Saved messages collection.",
    ai_rewrite: "Rewrite draft text with tone selection.",
    ai_summarize: "Summarize unread messages on demand.",
    ai_smart_reply: "On-demand reply suggestions.",
    ai_translate: "Per-message translation.",
    webrtc_calls: "P2P audio/video via Cable signaling.",
    gif_search: "Server-side Tenor GIF search proxy (NR-29).",
    voice_transcription: "Voice-note transcription via Groq whisper (NR-33)."
  }.freeze

  DEFINITIONS = DESCRIPTIONS.keys.index_with do |key|
    { default: PRODUCTION_ENABLED.include?(key), description: DESCRIPTIONS.fetch(key) }
  end.freeze

  class << self
    def registered?(key)
      DEFINITIONS.key?(key.to_sym)
    end

    def default_for(key)
      DEFINITIONS.fetch(key.to_sym).fetch(:default)
    end

    def description_for(key)
      DEFINITIONS.fetch(key.to_sym).fetch(:description)
    end

    def keys
      DEFINITIONS.keys
    end

    def unregistered_keys
      FeatureFlag.where.not(key: keys.map(&:to_s)).order(:key).pluck(:key)
    end
  end
end
