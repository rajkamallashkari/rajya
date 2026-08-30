class MessagePageResource < ApplicationResource
  attribute :messages do
    snapshot = tick_snapshot
    object.messages.map do |message|
      MessageResource.new(message, params: params.to_h.merge(tick_snapshot: snapshot)).to_h
    end
  end

  attribute :meta do
    {
      "has_more_before" => object.has_more_before,
      "has_more_after" => object.has_more_after,
      "oldest_position" => object.oldest_position,
      "newest_position" => object.newest_position,
      "pivot_id" => object.pivot_id
    }
  end

  private

  def tick_snapshot
    message = object.messages.first
    return if message.nil? || params[:current_account].blank?

    Messages::Ticks.snapshot_for(message.conversation)
  end
end
