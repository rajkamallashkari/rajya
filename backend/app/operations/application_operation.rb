# One public #call per subclass; every state change in the app is a subclass of
# this (CONVENTIONS.md §2.1/§2.2, TARGET_ARCHITECTURE.md §4.3). Reusable from
# HTTP, Cable, jobs, and (later) autonomous agents — never assume a human
# `current_user` without also accepting the acting `account`.
class ApplicationOperation
  def self.call(...)
    new.call(...)
  end

  private

  def success(value = nil)
    Result.success(value)
  end

  def failure(error_code, details: {})
    Errors.http_status_for(error_code) # raises Errors::UnknownErrorCode for a typo'd code
    Result.failure(error_code, details: details)
  end
end
