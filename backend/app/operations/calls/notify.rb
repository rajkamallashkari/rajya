module Calls
  module Notify
    module_function

    def to_account(account_id, event, payload = {})
      Realtime.publish(Realtime.signaling_stream(account_id), event, payload)
    end

    def to_others(call, except_account_id, event, payload = {})
      call.other_account_ids(except_account_id).each do |account_id|
        to_account(account_id, event, payload)
      end
    end

    def to_all(call, event, payload = {})
      call.participant_account_ids.each { |account_id| to_account(account_id, event, payload) }
    end
  end
end
