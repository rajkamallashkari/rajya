# Request-scoped client metadata for session rows. Operations never see the
# Rack request (CONVENTIONS.md §2.1); they read these attributes instead.
module Auth
  class RequestContext < ActiveSupport::CurrentAttributes
    attribute :ip, :user_agent
  end
end
