require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- named SCHEMA §8 keys
RSpec.describe Settings::Registry do
  it "registers every SCHEMA_DESIGN.md §8 constant category" do
    categories = described_class.entries.values.map { |entry| entry.fetch(:category) }.uniq

    expect(categories).to include(:messaging, :groups, :media, :calls, :ai, :notifications, :realtime, :auth, :moderation, :search)
  end

  it "registers the named messaging, auth and search settings from the constants table" do
    expect(described_class.keys).to include(
      :message_edit_window, :pins_per_conversation, :attachments_per_message,
      :otp_length, :rate_limit_login_attempts, :email_from_name,
      :nickname_max_length, :session_last_seen_granularity,
      :search_min_query_length, :search_debounce, :search_snippet_radius, :poll_min_options,
      :contacts_per_message, :latitude_min, :rrule_count_max, :rrule_interval_max, :multi_select_cap,
      :reminder_note_max_length, :saved_reply_shortcut_max_length,
      :presence_ttl, :last_active_debounce, :presence_offline_grace,
      :mention_everyone_limit, :mention_everyone_period, :slow_mode_presets,
      :file_caps, :user_quota_bytes, :blocked_upload_extensions, :orphan_blob_max_age, :gallery_page_size,
      :sticker_pack_max_bytes, :gif_search_limit, :ai_transcribe_models, :ai_bot_reply_models,
      :ai_reply_rate_limit, :ai_reply_retry_attempts, :ollama_base_url, :location_tile_request_cap,
      :notification_cascade_defaults, :stun_urls, :turn_port, :turn_credential_ttl,
      :metered_ice_timeout, :metered_ice_cache_ttl, :ring_timeout, :mesh_participant_cap,
      :ice_restart_max_attempts, :group_video_resolution, :group_video_frame_rate
    )
  end

  it "treats a missing key as unregistered" do
    expect(described_class.registered?(:not_a_real_setting)).to be(false)
  end
end
# rubocop:enable RSpec/ExampleLength
