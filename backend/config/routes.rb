Rails.application.routes.draw do
  # Liveness — process is up, no dependency checks (TARGET §4.9 / NR-10).
  get "up" => "rails/health#show", as: :rails_health_check

  # Readiness — Postgres, Redis, Solid Queue, object storage.
  get "health" => "health#show", as: :readiness_check

  # Generated OpenAPI document (TARGET §4.5).
  mount Rswag::Api::Engine => "/api-docs"

  # Session 2.2 login methods. GIS is POST-only (JWT in the body). The legacy
  # GET /google/callback redirect is intentionally absent (F-25).
  namespace :auth do
    post :google, to: "google#create"
    post :register, to: "passwords#create"
    post :login, to: "passwords#login"
    post :forgot_password, to: "passwords#forgot"
    post :reset_password, to: "passwords#reset"
    post "otp/request", to: "otp#create"
    post "otp/verify", to: "otp#verify"
    post "magic_link/request", to: "magic_links#create"
    post "magic_link/verify", to: "magic_links#verify"
  end
end
