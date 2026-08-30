# Message info from watermarks + receipt_marks (SCHEMA §5). Tick MIN uses
# watermarks; exact `at` is the first covering mark (D-5).
module Messages
  Receipt = Struct.new(:account, :at, keyword_init: true)

  InfoResult = Struct.new(:delivered, :read, keyword_init: true)

  class Watermarks < ApplicationQuery
    def initialize(message:, viewer: nil)
      @message = message
      @viewer = viewer
    end

    def call
      InfoResult.new(delivered: delivered_rows, read: read_rows)
    end

    private

    def delivered_rows
      others.filter_map do |row|
        next unless row.last_delivered_position >= @message.position

        Receipt.new(account: row.account, at: exact_time(row, "delivered") || row.last_delivered_at)
      end
    end

    def read_rows
      return [] unless disclose_read?

      others.filter_map do |row|
        mark = covering_mark(row, "read")
        next if mark.nil?
        next unless row.account.bot? || row.account.read_receipts?

        Receipt.new(account: row.account, at: mark.occurred_at)
      end
    end

    def disclose_read?
      @viewer.nil? || @viewer.read_receipts?
    end

    def covering_mark(row, kind)
      row.receipt_marks.select { |mark| mark.kind == kind }.find { |mark| mark.covers?(@message.position) }
    end

    def exact_time(row, kind)
      covering_mark(row, kind)&.occurred_at
    end

    def others
      @others ||= memberships.reject { |row| row.account_id == @message.sender_account_id }
    end

    def memberships
      @message.conversation.conversation_memberships.active.includes(:receipt_marks, account: :preference).to_a
    end
  end
end
