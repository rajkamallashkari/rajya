class ApplicationJob < ActiveJob::Base
  # Media rows and their Active Storage attachments are created inside the
  # message transaction. A separate Solid Queue worker must not observe the
  # job before that transaction commits.
  self.enqueue_after_transaction_commit = true

  # Automatically retry jobs that encountered a deadlock
  # retry_on ActiveRecord::Deadlocked

  # Most jobs are safe to ignore if the underlying records are no longer available
  # discard_on ActiveJob::DeserializationError
end
