module Admin
  module Transcripts
    class Show < ApplicationOperation
      def call(admin:, conversation:, before: nil, after: nil, ip: nil)
        return failure(:forbidden) unless admin.is_admin?
        return failure(:not_found) if conversation.nil?

        before_cursor = parse_cursor(before)
        after_cursor = parse_cursor(after)
        return failure(:validation_failed) if [ before_cursor, after_cursor ].include?(:invalid)
        return failure(:validation_failed) if before_cursor.present? && after_cursor.present?

        Audit::Record.call(
          admin: admin,
          action: "transcript.read",
          target: conversation,
          ip: ip
        )
        success(Messages::Page.call(scope: conversation.messages, before: before_cursor, after: after_cursor))
      end

      private

      def parse_cursor(value)
        return if value.blank?

        Integer(value)
      rescue ArgumentError, TypeError
        :invalid
      end
    end
  end
end
