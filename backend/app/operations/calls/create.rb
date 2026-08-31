module Calls
  class Create < ApplicationOperation
    def call(account:, conversation:, kind:)
      @account = account
      @conversation = conversation
      @kind = kind.to_s
      return failure(:not_found) unless FeatureFlag.enabled?(:webrtc_calls, account: @account)
      return failure(:forbidden) unless ConversationPolicy.new(@account, @conversation).start_call?
      return failure(:validation_failed) unless Call::KINDS.include?(@kind)

      ExpireStale.call
      humans = Conversations::HumanMembers.call(conversation_id: @conversation.id)
      cap = Settings.fetch(:mesh_participant_cap)
      # rubocop:disable Rajya/NoMagicNumbers -- a call needs the initiator plus one callee
      return failure(:validation_failed, details: { reason: "insufficient_participants" }) if humans.size < 2
      # rubocop:enable Rajya/NoMagicNumbers
      return failure(:validation_failed, details: { reason: "too_many_participants" }) if humans.size > cap
      return failure(:conflict, details: { reason: "already_in_call" }) if Call.live_for?(@account.id)

      persist(humans)
    rescue ActiveRecord::RecordNotUnique
      failure(:conflict, details: { reason: "already_in_call" })
    end

    private

    def persist(humans)
      call = insert!(humans)
      History.call(call: call)
      busy_only = notify_callees!(call)
      if busy_only
        call.with_lock { State.mark_missed!(call) }
        History.call(call: call.reload, busy: true)
      end
      success(Envelope.new(call: call.reload, ice_servers: IceServers.new.credentials_for(@account)))
    end

    def insert!(humans)
      Call.transaction do
        call = Call.create!(
          conversation: @conversation,
          initiator_account: @account,
          kind: @kind,
          status: "ringing"
        )
        humans.each do |account_id|
          status = participant_status_for(account_id)
          call.call_participants.create!(
            account_id: account_id,
            status: status,
            joined_at: status == "joined" ? Time.current : nil
          )
        end
        call
      end
    end

    def participant_status_for(account_id)
      return "joined" if account_id == @account.id
      return "busy" if Call.live_for?(account_id)

      "ringing"
    end

    def notify_callees!(call)
      callees = call.call_participants.reject { |row| row.account_id == call.initiator_account_id }
      payload = incoming_payload(call)
      callees.each do |row|
        if row.status == "busy"
          Notify.to_account(call.initiator_account_id, :busy, "call_id" => call.id, "account_id" => row.account_id)
        else
          Notify.to_account(row.account_id, :incoming_call, payload)
        end
      end
      callees.any? && callees.all? { |row| row.status == "busy" }
    end

    def incoming_payload(call)
      initiator = call.initiator_account
      {
        "call_id" => call.id,
        "conversation_id" => call.conversation_id,
        "kind" => call.kind,
        "initiator_account_id" => initiator.id,
        "initiator_display_name" => initiator.display_name,
        "initiator_username" => initiator.username
      }
    end
  end
end
