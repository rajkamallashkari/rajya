module Calls
  class Decline < ApplicationOperation
    def call(account:, call:)
      @account = account
      @call = call
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: @account)
      return failure(:forbidden) unless @call.includes_account?(@account.id)

      outcome = apply!
      return outcome if outcome.failure?

      History.call(call: @call.reload) if outcome.value
      Notify.to_others(@call, @account.id, :call_declined, "call_id" => @call.id, "account_id" => @account.id)
      Notify.to_account(@account.id, :call_dismissed, "call_id" => @call.id, "reason" => "declined_here")
      success(Envelope.new(call: @call.reload, ice_servers: nil))
    end

    private

    def apply!
      finalized = nil
      @call.with_lock do
        @call.reload
        return failure(:conflict) unless @call.status == "ringing"

        participant = @call.participant_for(@account.id)
        return failure(:forbidden) if participant.nil?

        participant.update!(status: "declined", left_at: Time.current)
        # rubocop:disable Rajya/NoMagicNumbers -- 1:1 decline ends the call (two participants)
        one_to_one = @call.call_participants.count <= 2
        # rubocop:enable Rajya/NoMagicNumbers
        finalized = if one_to_one
                      State.mark_declined!(@call)
        elsif !State.pending_callees?(@call)
                      State.mark_missed!(@call)
        end
      end
      Result.success(finalized)
    end
  end
end
