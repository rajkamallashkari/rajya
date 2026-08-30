module Messages
  class Index < ApplicationOperation
    def call(scope:, account: nil, before: nil, after: nil, around_id: nil, around_at: nil, after_revision: nil)
      @scope = scope
      @account = account
      @before = parse_cursor(before)
      @after = parse_cursor(after)
      @after_revision = parse_cursor(after_revision)
      return failure(:validation_failed) if [ @before, @after, @after_revision ].include?(:invalid)
      return failure(:validation_failed) if @before.present? && @after.present?
      return failure(:validation_failed) if catch_up_conflict?(around_id, around_at)
      return failure(:validation_failed) if @after_revision.present? && @after_revision.negative?

      result = if @after_revision.present?
        success(CatchUp.call(scope: @scope, after: @after_revision))
      elsif around_id.present? || around_at.present?
        jump(around_id, around_at)
      else
        page
      end
      ack_delivered!(result)
      result
    end

    private

    def page
      success(Page.call(scope: @scope, before: @before, after: @after))
    end

    def ack_delivered!(result)
      return unless result.success?
      return if @account.blank?

      page_result = result.value
      newest = page_result.newest_position
      return if newest.blank?

      message = page_result.messages.max_by(&:position)
      return if message.nil?

      Receipts::Advance.call(
        account: @account, conversation: message.conversation, position: newest, kind: "delivered"
      )
    end

    def jump(around_id, around_at)
      pivot = around_id.present? ? @scope.find_by(id: around_id) : pivot_at(around_at)
      return failure(:validation_failed) if pivot == :invalid
      return failure(:not_found) if pivot.nil?

      success(Around.call(scope: @scope, pivot: pivot))
    end

    def pivot_at(value)
      time = Time.iso8601(value.to_s)
      table = Message.arel_table
      @scope.where(table[:created_at].gteq(time)).order(:position).first ||
        @scope.where(table[:created_at].lt(time)).order(position: :desc).first
    rescue ArgumentError, TypeError
      :invalid
    end

    def catch_up_conflict?(around_id, around_at)
      @after_revision.present? && (
        @before.present? || @after.present? || around_id.present? || around_at.present?
      )
    end

    def parse_cursor(value)
      return if value.blank?

      Integer(value)
    rescue ArgumentError, TypeError
      :invalid
    end
  end
end
