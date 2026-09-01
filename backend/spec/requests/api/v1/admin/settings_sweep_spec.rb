require "rails_helper"

# SCHEMA_DESIGN.md §8 constants table — every registry key is writable through
# the admin settings API and takes effect without a restart (NR-6 / R-15).
# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations -- SCHEMA §8 inventory
RSpec.describe "Schema §8 configurability sweep", type: :request do
  around do |example|
    previous = Rack::Attack.enabled
    Rack::Attack.enabled = false
    example.run
    Rack::Attack.enabled = previous
  end

  def alternate(definition)
    default = definition.fetch(:default)
    case definition.fetch(:type)
    when :integer
      return definition[:min] || 2 if default.nil?

      default == definition[:min] ? (definition[:max] || default + 1) : (definition[:min] || default + 1)
    when :float
      default == definition[:min] ? default + 0.1 : (definition[:min] || 0)
    when :boolean
      !default
    when :string
      default.to_s.empty? ? "rajya" : "#{default}-admin"
    when :array
      Array(default) + [ "admin-sweep" ]
    when :object
      (default.respond_to?(:to_h) ? default.to_h : {}).merge("admin_sweep" => true)
    else
      default
    end
  end

  it "changes every registered setting through the API with no restart" do
    admin = create(:user, :admin)
    headers = auth_headers_for(admin)

    Settings::Registry.entries.each do |key, definition|
      next_value = alternate(definition)
      patch "/api/v1/admin/settings", headers: headers, as: :json, params: { key: key.to_s, value: next_value }
      expect(response).to have_http_status(:ok), "#{key} rejected: #{response.body}"
      expect(Settings.fetch(key)).to eq(Settings.send(:coerce, next_value, definition))
    end
  end

  def schema_rows
    {
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
    }
  end

  it "registers every named SCHEMA §8 constants-table row" do
    schema_rows.each_value do |keys|
      keys.each { |key| expect(Settings::Registry.registered?(key)).to be(true) }
    end
  end

  it "changes search_min_query_length behaviour with no restart" do
    admin = create(:user, :admin)
    viewer = create(:user)
    conversation = create_direct_between(viewer.account, create(:account))
    create(:message, conversation: conversation, sender_account: viewer.account, body: "ab token")
    expect(Search::Global.call(account: viewer.account, query: "ab").value.messages).not_to eq([])

    patch "/api/v1/admin/settings", headers: auth_headers_for(admin), as: :json,
          params: { key: "search_min_query_length", value: 3 }
    expect(response).to have_http_status(:ok)
    expect(Search::Global.call(account: viewer.account, query: "ab").value.messages).to eq([])
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
