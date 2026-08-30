# Message info from membership watermarks (shape only; P5 makes timestamps exact).
module Messages
  Receipt = Struct.new(:account, :at, keyword_init: true)

  InfoResult = Struct.new(:delivered, :read, keyword_init: true)

  class Watermarks < ApplicationQuery
    def initialize(message:)
      @message = message
    end

    def call
      recipients = memberships.reject { |row| row.account_id == @message.sender_account_id }
      InfoResult.new(delivered: receipts(recipients, :delivered), read: receipts(recipients, :read))
    end

    private

    def memberships
      @message.conversation.conversation_memberships.active.includes(:account).to_a
    end

    def receipts(rows, kind)
      position_attr = kind == :delivered ? :last_delivered_position : :last_read_position
      at_attr = kind == :delivered ? :last_delivered_at : :last_read_at
      rows.select { |row| row.public_send(position_attr) >= @message.position }
          .map { |row| Receipt.new(account: row.account, at: row.public_send(at_attr)) }
    end
  end
end
