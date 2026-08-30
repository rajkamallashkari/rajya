module Conversations
  # Atomic position/revision allocators (SCHEMA §4, AUDIT BR-31/BR-34).
  # Send bumps both counters; mutations bump revision only so display order
  # stays gapless while catch-up still sees the change.
  class Sequencer
    class << self
      def next_send!(conversation_id)
        row = execute(
          "UPDATE conversations SET next_position = next_position + 1, next_revision = next_revision + 1
           WHERE id = #{quoted(conversation_id)} RETURNING next_position, next_revision"
        )
        [ row.fetch("next_position").to_i, row.fetch("next_revision").to_i ]
      end

      def next_revision!(conversation_id)
        row = execute(
          "UPDATE conversations SET next_revision = next_revision + 1
           WHERE id = #{quoted(conversation_id)} RETURNING next_revision"
        )
        row.fetch("next_revision").to_i
      end

      private

      def execute(sql)
        row = ApplicationRecord.connection.select_one(sql)
        raise ActiveRecord::RecordNotFound unless row

        row
      end

      def quoted(value)
        ApplicationRecord.connection.quote(value)
      end
    end
  end
end
