# Readiness (NR-10). Liveness stays on Rails' GET /up — this action is the
# dependency probe and must never share that route.
class HealthController < ApplicationController
  def show
    report = Health::Checker.call
    http_status = report.ok? ? :ok : :service_unavailable
    render json: HealthResource.new(report).to_h, status: http_status
  end

  private

  def skip_authorization?
    true
  end

  def skip_authentication?
    true
  end
end
