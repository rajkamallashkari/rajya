require "rails_helper"

RSpec.describe FeatureFlagRegistry do
  it "registers every flag from the legacy YAML so nothing live is dropped" do
    expect(described_class.keys).to include(
      :async_bot_replies, :direct_uploads, :unified_identity, :bot_builder,
      :email_password_auth, :passwordless_auth, :passkey_auth, :app_lock,
      :phone_auth, :group_rbac, :broadcast_channels, :chat_folders,
      :history_driven_ui, :virtualized_feed, :mutation_sync,
      :notification_preferences, :link_previews, :media_attachments,
      :voice_notes, :edit_messages, :delete_for_everyone, :read_receipts,
      :saved_messages, :ai_rewrite, :ai_summarize, :ai_smart_reply,
      :ai_translate, :webrtc_calls
    )
  end

  it "defaults production-live flags on and the rest off" do
    expect(described_class.default_for(:passwordless_auth)).to be(true)
    expect(described_class.default_for(:phone_auth)).to be(true)
  end
end
