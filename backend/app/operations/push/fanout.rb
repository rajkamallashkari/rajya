# One job carrying a recipient list (F-19). Delivery and watermark wiring
# land in P10.2; this session only closes the unbatched enqueue.
module Push
  class Fanout < ApplicationOperation
    def call(event:, payload:, recipient_account_ids:)
      success(
        event: event.to_s,
        payload: payload.to_h,
        recipient_account_ids: Array(recipient_account_ids)
      )
    end
  end
end
