module Attachments
  UrlPayload = Struct.new(:url, :expires_at, keyword_init: true)
  PermanentFailure = Class.new(StandardError)
end
