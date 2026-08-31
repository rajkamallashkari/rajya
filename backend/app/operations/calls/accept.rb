module Calls
  class Accept < ApplicationOperation
    def call(account:, call:)
      @account = account
      @call = call
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: @account)
      return failure(:forbidden) unless @call.includes_account?(@account.id)

      outcome = apply!
      return outcome if outcome.failure?

      History.call(call: @call.reload)
      Notify.to_account(@account.id, :call_dismissed, "call_id" => @call.id, "reason" => "answered_here")
      Notify.to_others(@call, @account.id, :call_accepted, "call_id" => @call.id, "account_id" => @account.id)
      success(Envelope.new(call: @call.reload, ice_servers: IceServers.new.credentials_for(@account)))
    end

    private

    def apply!
      @call.with_lock do
        @call.reload
        return failure(:conflict) unless %w[ringing active].include?(@call.status)

        participant = @call.participant_for(@account.id)
        return failure(:forbidden) if participant.nil?

        participant.update!(status: "joined", joined_at: Time.current)
        @call.update!(status: "active", started_at: @call.started_at || Time.current)
      end
      Result.success(@call)
    end
  end
end
