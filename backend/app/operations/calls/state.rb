module Calls
  # Row-locked status mutations shared by HTTP, Cable, and the stale-call sweep.
  module State
    module_function

    def mark_ended!(call)
      return if call.terminal?

      call.update!(status: "ended", ended_at: Time.current)
      compute_duration!(call)
      release_live_participants!(call)
      :ended
    end

    def mark_missed!(call)
      return if call.terminal?

      call.update!(status: "missed", ended_at: Time.current)
      release_live_participants!(call)
      :missed
    end

    def mark_declined!(call)
      return if call.terminal?

      call.update!(status: "declined", ended_at: Time.current)
      release_live_participants!(call)
      :declined
    end

    def release_live_participants!(call)
      call.call_participants.where(status: CallParticipant::LIVE).update_all(
        status: "left", left_at: Time.current
      )
    end

    def release_orphaned_live_participants!
      CallParticipant
        .joins(:call)
        .where(status: CallParticipant::LIVE)
        .where.not(calls: { status: Call::IN_PROGRESS })
        .update_all(status: "left", left_at: Time.current)
    end

    def compute_duration!(call)
      return if call.started_at.blank? || call.ended_at.blank?

      call.update!(duration_seconds: (call.ended_at - call.started_at).to_i)
    end

    def pending_callees?(call)
      call.call_participants
          .where.not(account_id: call.initiator_account_id)
          .where(status: %w[invited ringing])
          .exists?
    end
  end
end
