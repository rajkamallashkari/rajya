# The error taxonomy (TARGET_ARCHITECTURE.md §4.6, CONVENTIONS.md §2.3): one
# mapping from a symbolic code to an HTTP status, and one response shape,
# `{ error: { code, message, details } }`. `message` is resolved through the
# string catalog so it stays admin-editable and translatable — the catalog
# (`translation_strings` + `t()`) lands in session 0.3; until then this reads
# Rails' own locale files under the same `errors.*` keys, so call sites do not
# change when the DB-backed catalog arrives.
module Errors
  TAXONOMY = {
    not_found: 404,
    unauthenticated: 401,
    forbidden: 403,
    validation_failed: 422,
    conflict: 409,
    rate_limited: 429,
    quota_exceeded: 507,
    upstream_failed: 502
  }.freeze

  CODES = TAXONOMY.keys.freeze

  UnknownErrorCode = Class.new(StandardError)

  class << self
    def http_status_for(code)
      TAXONOMY.fetch(code) { raise UnknownErrorCode, code.inspect }
    end

    def message_for(code)
      I18n.t(code, scope: :errors, default: code.to_s.humanize)
    end

    def render(code, message: nil, details: {})
      {
        error: {
          code: code,
          message: message || message_for(code),
          details: details
        }
      }
    end
  end
end
