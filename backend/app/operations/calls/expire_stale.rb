module Calls
  class ExpireStale < ApplicationOperation
    def call
      State.release_orphaned_live_participants!
      Call.stale_ringing.find_each { |call| expire!(call, :missed) }
      Call.stale_active.find_each { |call| expire!(call, :ended) }
      success
    end

    private

    def expire!(call, outcome)
      finalized = nil
      call.with_lock do
        call.reload
        next if call.terminal?

        finalized = outcome == :ended ? State.mark_ended!(call) : State.mark_missed!(call)
      end
      return if finalized.nil?

      History.call(call: call.reload)
      # BR-65: a ring timeout is a miss, not call_cancelled/timeout.
      event = outcome == :ended ? :call_ended : :call_missed
      Notify.to_all(call, event, "call_id" => call.id)
    end
  end
end
