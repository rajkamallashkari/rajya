module Calls
  # Cable actions: opaque SDP/ICE relay (BR-69) plus join/leave/busy/heartbeat.
  class Signal < ApplicationOperation
    ACTIONS = %w[signal join leave dismiss heartbeat busy mute_state].freeze
    RELAY_TYPES = %w[offer answer ice_candidate].freeze

    def call(account:, action:, data:)
      @account = account
      @data = data.to_h.stringify_keys
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: @account)
      return failure(:validation_failed) unless ACTIONS.include?(action.to_s)

      @call = Call.find_by(id: @data["call_id"])
      return failure(:not_found) unless @call&.includes_account?(@account.id)

      dispatch(action.to_s)
    end

    private

    def dispatch(action)
      case action
      when "signal" then relay!
      when "join" then announce!(:user_joined)
      when "leave" then leave!
      when "dismiss" then dismiss!
      when "heartbeat" then heartbeat!
      when "busy" then busy!
      else mute_state!
      end
    end

    def relay!
      signal_type = @data["type"].to_s
      target_id = @data["to_account_id"].to_i
      return failure(:validation_failed) unless RELAY_TYPES.include?(signal_type)
      return failure(:forbidden) unless @call.includes_account?(target_id)
      return failure(:forbidden) if target_id == @account.id

      Notify.to_account(
        target_id, signal_type,
        "call_id" => @call.id, "from_account_id" => @account.id, "payload" => @data["payload"]
      )
      success(@call)
    end

    def announce!(event)
      Notify.to_others(@call, @account.id, event, "call_id" => @call.id, "account_id" => @account.id)
      success(@call)
    end

    def leave!
      participant = @call.participant_for(@account.id)
      participant.update!(status: "left", left_at: Time.current) if participant&.status == "joined"
      announce!(:user_left)
    end

    def dismiss!
      Notify.to_account(
        @account.id, :call_dismissed,
        "call_id" => @call.id, "reason" => @data["reason"].presence || "dismissed"
      )
      success(@call)
    end

    def heartbeat!
      @call.touch if @call.status == "active"
      success(@call)
    end

    def busy!
      participant = @call.participant_for(@account.id)
      return failure(:conflict) unless participant && %w[invited ringing].include?(participant.status)

      participant.update!(status: "busy")
      Notify.to_account(
        @call.initiator_account_id, :busy,
        "call_id" => @call.id, "account_id" => @account.id
      )
      success(@call)
    end

    def mute_state!
      Notify.to_others(
        @call, @account.id, :mute_state,
        "call_id" => @call.id,
        "account_id" => @account.id,
        "mic_on" => ActiveModel::Type::Boolean.new.cast(@data["mic_on"]),
        "cam_on" => ActiveModel::Type::Boolean.new.cast(@data["cam_on"])
      )
      success(@call)
    end
  end
end
