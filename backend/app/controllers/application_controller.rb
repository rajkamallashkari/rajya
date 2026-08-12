# Thin. A controller authenticates, authorizes, delegates to exactly one
# operation, and renders one serializer — target ≤15 lines per action
# (CONVENTIONS.md §2.1). This base class owns the three things every action
# needs: the authorization guard, `current_account`/`current_user`, and the
# error taxonomy → HTTP mapping (TARGET_ARCHITECTURE.md §4.4/§4.6).
class ApplicationController < ActionController::API
  include Pundit::Authorization

  # A missing `authorize` (or `policy_scope` on an index) call fails the test
  # suite, not production (F-1 fix). Real controllers land in later sessions;
  # this stays armed from the first one.
  after_action :verify_authorized, unless: :skip_authorization?
  after_action :verify_policy_scoped, if: :index_action?

  rescue_from Pundit::NotAuthorizedError, with: -> { render_error(:forbidden) }
  rescue_from ActiveRecord::RecordNotFound, with: -> { render_error(:not_found) }
  rescue_from Errors::UnknownErrorCode, with: -> { render_error(:validation_failed) }

  private

  # Pundit authorizes `current_account` — the participant acting in
  # conversations — never `current_user`, the human who authenticated
  # (CONVENTIONS.md §2.4).
  def pundit_user
    current_account
  end

  # Wired by the authentication flow (Phase 2). Every later session that adds
  # a real endpoint replaces this with a lookup from the session / credentials
  # epoch, not a new ad hoc method.
  def current_account
    nil
  end

  def current_user
    nil
  end

  def index_action?
    action_name == "index"
  end

  def skip_authorization?
    false
  end

  # Renders a `Result` from an operation: the serializer on success, the error
  # taxonomy on failure. `serializer` is a class, not an instance — this method
  # owns instantiation so every call site stays declarative.
  def render_result(result, serializer:, status: :ok)
    if result.success?
      render json: serializer.new(result.value).to_h, status: status
    else
      render_error(result.error_code, details: result.error_details)
    end
  end

  def render_error(code, details: {})
    render json: Errors.render(code, details: details), status: Errors.http_status_for(code)
  end
end
