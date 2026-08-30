module Receipts
  class Advance < ApplicationOperation
    KINDS = %w[delivered viewed bot_consume].freeze

    def call(account:, conversation:, position:, kind:)
      @account = account
      @conversation = conversation
      @position = parse_position(position)
      @kind = kind.to_s
      return failure(:validation_failed) if @position == :invalid
      return failure(:validation_failed) unless KINDS.include?(@kind)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).show?
      return failure(:not_found) if membership.blank?
      return failure(:forbidden) if @kind == "bot_consume" && account.human?

      apply
      success(Conversations::Show.call(account: account, conversation: conversation).value)
    end

    private

    def apply
      capped = [ @position, max_position ].min
      return if capped < 1

      if @kind == "delivered"
        Writer.deliver!(membership, capped)
        publish!("delivered", capped)
      elsif @kind == "viewed"
        Writer.view!(membership, capped, disclose_read: @account.read_receipts?)
        publish_viewed!(capped)
      else
        Writer.consume!(membership, capped)
        publish!("delivered", capped)
        publish!("read", capped)
      end
    end

    def publish_viewed!(capped)
      publish!("delivered", capped)
      publish!("read", capped) if @account.read_receipts? && membership.reload.last_read_position >= capped
    end

    def publish!(kind, position)
      Realtime.publish(
        @conversation, :receipts_updated,
        "account_id" => @account.id, "kind" => kind, "position" => position
      )
    end

    def membership
      @membership ||= Conversations::View.membership_for(@conversation, @account)
    end

    def max_position
      @conversation.messages.maximum(:position).to_i
    end

    def parse_position(value)
      Integer(value)
    rescue ArgumentError, TypeError
      :invalid
    end
  end
end
