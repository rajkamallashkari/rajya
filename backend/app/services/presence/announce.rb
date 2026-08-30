# Privacy-gated presence fanout: one viewer query, then one publish per
# presence stream (TARGET §3). The subject always receives their own event so
# other devices stay in sync even when last_active is off.
module Presence
  class Announce
    def self.call(account:, online:)
      new(account: account, online: online).call
    end

    def initialize(account:, online:)
      @account = account
      @online = online
    end

    def call
      recipient_ids.each do |account_id|
        Realtime.publish(
          Realtime.presence_stream(account_id),
          :presence,
          "account_id" => @account.id, "online" => @online
        )
      end
    end

    private

    def recipient_ids
      ([ @account.id ] + Viewers.call(account: @account)).uniq
    end
  end
end
