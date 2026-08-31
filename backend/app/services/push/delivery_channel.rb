# Adapter seam (TARGET §9). Web Push is the only implementation; email or
# native push would be another class that `current` can point at.
module Push
  class DeliveryChannel
    def self.current
      WebPush
    end

    def self.deliver(account:, payload:)
      current.deliver(account: account, payload: payload)
    end
  end
end
