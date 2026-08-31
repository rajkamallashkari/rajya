module Calls
  class Cancel < ApplicationOperation
    def call(account:, call:)
      @account = account
      @call = call
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: @account)

      outcome = apply!
      return outcome if outcome.failure?

      History.call(call: @call.reload)
      Notify.to_others(@call, @account.id, :call_cancelled, "call_id" => @call.id, "account_id" => @account.id)
      success(Envelope.new(call: @call.reload, ice_servers: nil))
    end

    private

    def apply!
      finalized = nil
      @call.with_lock do
        @call.reload
        return failure(:conflict) unless @call.status == "ringing"
        return failure(:forbidden) unless @call.initiator_account_id == @account.id

        finalized = State.mark_missed!(@call)
      end
      Result.success(finalized)
    end
  end
end
