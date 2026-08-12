# Read models live here — the only place complex reads happen (CONVENTIONS.md
# §2.1). Queries never write. Unlike an operation, a query's #call takes
# whatever arguments the read needs and returns data (a relation, a hash, an
# array) rather than a `Result` — there is no failure mode to represent.
class ApplicationQuery
  def self.call(...)
    new(...).call
  end

  def call
    raise NotImplementedError, "#{self.class} must implement #call"
  end
end
