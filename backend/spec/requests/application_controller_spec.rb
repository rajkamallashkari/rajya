# Exercises ApplicationController's shared plumbing (auth guard,
# current_account/current_user, error taxonomy rendering) and, as a side
# effect, ApplicationResource — there is no real endpoint yet to piggyback on
# (session 0.2 ships the skeleton, not a feature), so this spec stands up a
# throwaway controller + route rather than skip the base class.
require "rails_helper"

class ApplicationControllerProbeResource < ApplicationResource
  attributes :id
end

# Permissive on purpose — this spec exercises the base controller's plumbing,
# not a real permission matrix (that lands with the first real resource).
class ApplicationControllerProbePolicy < ApplicationPolicy
  def show?
    true
  end

  def index?
    true
  end
end

class ApplicationControllerProbesController < ApplicationController
  def guarded
    # Deliberately skips `authorize` — exercises the default (unoverridden)
    # skip_authorization? plus verify_authorized's F-1 guard.
    render json: {}
  end

  def identity
    authorize :probe, :show?, policy_class: ApplicationControllerProbePolicy
    render json: { pundit_user: pundit_user, current_account: current_account, current_user: current_user }
  end

  def index
    authorize :probe, :index?, policy_class: ApplicationControllerProbePolicy
    skip_policy_scope
    render json: []
  end

  def raise_forbidden
    raise Pundit::NotAuthorizedError
  end

  def raise_not_found
    raise ActiveRecord::RecordNotFound
  end

  def raise_unknown_error
    render_error(:not_a_real_code)
  end

  def show_success
    authorize :probe, :show?, policy_class: ApplicationControllerProbePolicy
    render_result(Result.success(Struct.new(:id).new(1)), serializer: ApplicationControllerProbeResource)
  end

  def show_failure
    authorize :probe, :show?, policy_class: ApplicationControllerProbePolicy
    render_result(Result.failure(:validation_failed, details: { field: "x" }),
                   serializer: ApplicationControllerProbeResource)
  end
end

RSpec.describe "ApplicationController", type: :request do
  around do |example|
    Rails.application.routes.draw do
      get "/__probes/guarded", to: "application_controller_probes#guarded"
      get "/__probes/identity", to: "application_controller_probes#identity"
      get "/__probes", to: "application_controller_probes#index"
      get "/__probes/forbidden", to: "application_controller_probes#raise_forbidden"
      get "/__probes/not_found", to: "application_controller_probes#raise_not_found"
      get "/__probes/unknown_error", to: "application_controller_probes#raise_unknown_error"
      get "/__probes/success", to: "application_controller_probes#show_success"
      get "/__probes/failure", to: "application_controller_probes#show_failure"
    end

    example.run

    Rails.application.reload_routes!
  end

  it "fails a missing authorize call instead of letting it through silently" do
    expect { get "/__probes/guarded" }.to raise_error(Pundit::AuthorizationNotPerformedError)
  end

  it "exposes pundit_user as current_account, and current_user/current_account as nil until Phase 2 wires auth" do
    get "/__probes/identity"

    expect(response.parsed_body).to eq("pundit_user" => nil, "current_account" => nil, "current_user" => nil)
  end

  it "requires policy_scope on index and renders once satisfied" do
    get "/__probes"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq([])
  end

  it "renders 403 for Pundit::NotAuthorizedError" do
    get "/__probes/forbidden"

    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body["error"]["code"]).to eq("forbidden")
  end

  it "renders 404 for ActiveRecord::RecordNotFound" do
    get "/__probes/not_found"

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body["error"]["code"]).to eq("not_found")
  end

  it "renders 422 for an unregistered error code raised via Errors::UnknownErrorCode" do
    get "/__probes/unknown_error"

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body["error"]["code"]).to eq("validation_failed")
  end

  it "renders the serializer on a successful Result" do
    get "/__probes/success"

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq("id" => 1)
  end

  it "renders the error taxonomy on a failed Result" do
    get "/__probes/failure"

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body["error"]).to eq(
      "code" => "validation_failed", "message" => Errors.message_for(:validation_failed), "details" => { "field" => "x" }
    )
  end
end
