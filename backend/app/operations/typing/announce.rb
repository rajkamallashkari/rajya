module Typing
  class Announce < ApplicationOperation
    def call(account:, conversation_id:, activity: nil)
      @account = account
      @conversation = Conversation.find_by(id: conversation_id)
      @activity = (activity.presence || "typing").to_s

      return failure(:not_found) if @conversation.nil?
      return failure(:forbidden) unless ConversationPolicy.new(@account, @conversation).send?
      return failure(:forbidden) unless @account.human?
      return failure(:validation_failed) unless Store::ACTIVITIES.include?(@activity)

      previous = Store.read(@conversation.id, @account.id)
      Store.write(@conversation.id, @account.id, @activity)
      publish! if previous != @activity || Store.claim_broadcast?(@conversation.id, @account.id)
      success(@activity)
    end

    private

    def publish!
      Realtime.publish(
        @conversation, :typing,
        "account_id" => @account.id,
        "activity" => @activity,
        "display_name" => @account.display_name
      )
    end
  end
end
