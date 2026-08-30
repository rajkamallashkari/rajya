# Per-message tick state (NR-2). Queued and failed stay client-only.
module Messages
  class Ticks < ApplicationQuery
    STATUSES = %w[sent delivered read].freeze

    Snapshot = Struct.new(:memberships, :read_marks, keyword_init: true) do
      def self.load(conversation)
        rows = conversation.conversation_memberships.active.includes(:receipt_marks, account: :preference).to_a
        marks = rows.each_with_object({}) do |row, map|
          map[row.id] = row.receipt_marks.select { |mark| mark.kind == "read" }
        end
        new(memberships: rows, read_marks: marks)
      end
    end

    def self.snapshot_for(conversation)
      Snapshot.load(conversation)
    end

    def initialize(message:, viewer:, snapshot: nil)
      @message = message
      @viewer = viewer
      @snapshot = snapshot || Snapshot.load(message.conversation)
    end

    def call
      return unless @message.sender_account_id == @viewer.id
      return "sent" if others.empty?
      return "sent" unless delivered?
      return "read" if read?

      "delivered"
    end

    private

    def delivered?
      recipients.all? { |row| row.last_delivered_position >= @message.position }
    end

    def read?
      return false unless @viewer.read_receipts? || bot_only?

      recipients.all? { |row| covering_read?(row) }
    end

    def covering_read?(row)
      Array(@snapshot.read_marks[row.id]).any? { |mark| mark.covers?(@message.position) }
    end

    def recipients
      @recipients ||= begin
        humans = human_recipients
        humans.any? ? humans : bot_recipients
      end
    end

    def human_recipients
      @human_recipients ||= others.select { |row| row.account.human? }
    end

    def bot_recipients
      @bot_recipients ||= others.select { |row| row.account.bot? }
    end

    def bot_only?
      human_recipients.empty? && bot_recipients.any?
    end

    def others
      @others ||= @snapshot.memberships.reject { |row| row.account_id == @message.sender_account_id }
    end
  end
end
