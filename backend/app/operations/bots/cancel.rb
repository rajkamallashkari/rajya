module Bots
  class Cancel < ApplicationOperation
    def call(account:, conversation:, generation_id:)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).cancel_generation?
      return failure(:validation_failed) if generation_id.blank?

      Ai::Cancellation.request!(generation_id)
      success({ generation_id: generation_id.to_s })
    end
  end
end
