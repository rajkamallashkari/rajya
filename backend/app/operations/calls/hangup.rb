module Calls
  class Hangup < ApplicationOperation
    def call(account:, call:)
      @account = account
      @call = call
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: @account)
      return failure(:forbidden) unless @call.includes_account?(@account.id)

      outcome = apply!
      return outcome if outcome.failure?

      History.call(call: @call.reload) if outcome.value
      Notify.to_others(@call, @account.id, :call_ended, "call_id" => @call.id, "account_id" => @account.id)
      success(Envelope.new(call: @call.reload, ice_servers: nil))
    end

    private

    def apply!
      finalized = nil
      @call.with_lock do
        @call.reload
        return failure(:conflict) unless %w[ringing active].include?(@call.status)

        @call.participant_for(@account.id)&.update!(status: "left", left_at: Time.current)
        remaining = @call.call_participants.where(status: "joined").where.not(account_id: @account.id)
        # rubocop:disable Rajya/NoMagicNumbers -- 1:1 hangup ends the call (two participants)
        one_to_one = @call.call_participants.count <= 2
        # rubocop:enable Rajya/NoMagicNumbers
        finalize = remaining.empty? || @call.status == "ringing" || one_to_one
        finalized = State.mark_ended!(@call) if finalize
      end
      Result.success(finalized)
    end
  end
end
