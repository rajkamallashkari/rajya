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
  before_action :capture_client_context
  before_action :authenticate!, unless: :skip_authentication?
  around_action :audit_impersonated_write, unless: :skip_authentication?
  after_action :verify_authorized, unless: :skip_authorization?
  after_action :verify_policy_scoped, if: :index_action?

  rescue_from Pundit::NotAuthorizedError, with: :render_forbidden
  rescue_from ActiveRecord::RecordNotFound, with: -> { render_error(:not_found) }
  rescue_from Errors::UnknownErrorCode, with: -> { render_error(:validation_failed) }

  private

  # Pundit authorizes `current_account` — the participant acting in
  # conversations — never `current_user`, the human who authenticated
  # (CONVENTIONS.md §2.4).
  def pundit_user
    current_account
  end

  def current_account
    @current_account
  end

  def current_user
    @current_user
  end

  def current_session
    @current_session
  end

  def current_impersonator_id
    @current_impersonator_id
  end

  def impersonating?
    current_impersonator_id.present?
  end

  def capture_client_context
    Auth::RequestContext.ip = request.remote_ip
    Auth::RequestContext.user_agent = request.user_agent
  end

  def authenticate!
    context = Auth::Identity.from_http(request)
    if context
      @current_user = context.user
      @current_account = context.account
      @current_session = context.session
      @current_impersonator_id = context.impersonator_id
      context.session.touch_last_seen!
      log_request_identities
      return
    end

    skip_authorization
    skip_policy_scope
    render_error(:unauthenticated)
  end

  def index_action?
    action_name == "index"
  end

  def skip_authorization?
    false
  end

  def skip_authentication?
    false
  end

  # Renders a `Result` from an operation: the serializer on success, the error
  # taxonomy on failure. `serializer` is a class, not an instance — this method
  # owns instantiation so every call site stays declarative.
  def render_result(result, serializer:, status: :ok)
    if result.success?
      render json: serializer.new(result.value, params: serializer_params).to_h, status: status
    else
      render_error(result.error_code, details: result.error_details)
    end
  end

  def render_forbidden
    skip_authorization
    skip_policy_scope
    render_error(:forbidden)
  end

  def serializer_params
    {
      current_account: current_account,
      current_jti: current_session&.jti,
      impersonator_id: current_impersonator_id
    }
  end

  def log_request_identities
    Rails.logger.info(
      {
        event: "auth.identities",
        user_id: current_user.id,
        account_id: current_account.id,
        impersonator_id: current_impersonator_id
      }.compact.to_json
    )
  end

  def audit_impersonated_write
    unless impersonating? && mutating_request? && !impersonation_controller?
      yield
      return
    end

    Audit::Record.call(
      admin: current_user,
      action: "#{controller_path}##{action_name}",
      impersonated_account: current_account,
      metadata: { "method" => request.request_method, "path" => request.path },
      ip: request.remote_ip
    )
    yield
  end

  def mutating_request?
    !request.get? && !request.head?
  end

  def impersonation_controller?
    controller_path == "api/v1/admin/impersonations"
  end

  def render_error(code, details: {})
    render json: Errors.render(code, details: details), status: Errors.http_status_for(code)
  end
end
