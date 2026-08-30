require "rails_helper"

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
      :search_min_query_length, :search_debounce,
      :poll_min_options, :contacts_per_message, :latitude_min,
      :rrule_count_max, :rrule_interval_max, :multi_select_cap,
      :reminder_note_max_length, :saved_reply_shortcut_max_length,
      :presence_ttl, :last_active_debounce, :presence_offline_grace
    )
  end

  it "treats a missing key as unregistered" do
    expect(described_class.registered?(:not_a_real_setting)).to be(false)
  end
end
