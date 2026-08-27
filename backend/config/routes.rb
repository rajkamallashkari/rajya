Rails.application.routes.draw do
  # Liveness — process is up, no dependency checks (TARGET §4.9 / NR-10).
  get "up" => "rails/health#show", as: :rails_health_check

  # Readiness — Postgres, Redis, Solid Queue, object storage.
  get "health" => "health#show", as: :readiness_check

  # Generated OpenAPI document (TARGET §4.5).
  mount Rswag::Api::Engine => "/api-docs"
end
