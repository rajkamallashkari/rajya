module Calls
  class SetScreenSharing < ApplicationOperation
    def call(account:, call:, sharing:)
      @account = account
      @call = call
      @sharing = ActiveModel::Type::Boolean.new.cast(sharing)
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: @account)
      return failure(:forbidden) unless @call.includes_account?(@account.id)
      return failure(:conflict) unless @call.status == "active"
      return failure(:forbidden) unless joined?
      return failure(:validation_failed, details: { reason: "screen_share_group" }) if @sharing && !one_to_one?

      apply!
      Notify.to_others(
        @call, @account.id, :screen_share,
        "call_id" => @call.id, "account_id" => @account.id, "sharing" => @sharing
      )
      success(Envelope.new(call: @call.reload, ice_servers: nil))
    end

    private

    def joined?
      @call.participant_for(@account.id)&.status == "joined"
    end

    def one_to_one?
      # rubocop:disable Rajya/NoMagicNumbers -- NR-47: a 1:1 mesh is two participants
      @call.call_participants.count <= 2
      # rubocop:enable Rajya/NoMagicNumbers
    end

    def apply!
      @call.with_lock do
        @call.reload
        @call.participant_for(@account.id)&.update!(is_screen_sharing: @sharing)
      end
    end
  end
end
