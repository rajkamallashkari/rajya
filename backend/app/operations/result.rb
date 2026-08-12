# The return value of every operation (CONVENTIONS.md §2.2). Never raise for an
# expected failure — return a `Result` with a symbolic error code and let the
# caller (a controller, a channel, a job) decide what to do with it.
class Result
  attr_reader :value, :error_code, :error_details

  def self.success(value = nil)
    new(success: true, value: value)
  end

  def self.failure(error_code, details: {})
    new(success: false, error_code: error_code, error_details: details)
  end

  def success?
    @success
  end

  def failure?
    !success?
  end

  private

  def initialize(success:, value: nil, error_code: nil, error_details: {})
    @success = success
    @value = value
    @error_code = error_code
    @error_details = error_details
  end
end
