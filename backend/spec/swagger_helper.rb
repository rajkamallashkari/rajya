# frozen_string_literal: true

require "rails_helper"

RSpec.configure do |config|
  config.openapi_root = Rails.root.join("swagger").to_s
  config.openapi_specs = {
    "v1/swagger.yaml" => {
      openapi: "3.0.1",
      info: {
        title: "Rajya API",
        version: "v1",
        description: "Rajya HTTP API. Generated from rswag-annotated request specs (TARGET §4.5)."
      },
      paths: {},
      servers: [
        { url: "http://localhost:3000", description: "Local development" }
      ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: :http,
              scheme: :bearer,
              bearerFormat: :JWT
            }
          },
          schemas: {
            Error: {
              type: :object,
              properties: {
                error: {
                  type: :object,
                  properties: {
                    code: { type: :string },
                    message: { type: :string },
                    details: { type: :object }
                  },
                  required: %w[code message details]
                }
              }
            },
            HealthCheck: {
              type: :object,
              properties: {
                status: { type: :string, enum: %w[ok error] },
                message: { type: :string }
              },
              required: %w[status]
            },
            Health: {
              type: :object,
              required: %w[status checks],
              properties: {
                status: { type: :string, enum: %w[ok error] },
                checks: {
                  type: :object,
                  properties: {
                    postgres: { "$ref" => "#/components/schemas/HealthCheck" },
                    redis: { "$ref" => "#/components/schemas/HealthCheck" },
                    solid_queue: { "$ref" => "#/components/schemas/HealthCheck" },
                    r2: { "$ref" => "#/components/schemas/HealthCheck" }
                  }
                }
              }
            },
            Account: {
              type: :object,
              required: %w[id username display_name kind],
              properties: {
                id: { type: :integer },
                username: { type: :string },
                display_name: { type: :string },
                kind: { type: :string }
              }
            },
            SessionUser: {
              type: :object,
              required: %w[id onboarded has_password has_passkey],
              properties: {
                id: { type: :integer },
                email: { type: :string, nullable: true },
                onboarded: { type: :boolean },
                has_password: { type: :boolean },
                has_passkey: { type: :boolean }
              }
            },
            Session: {
              type: :object,
              required: %w[token account user],
              properties: {
                token: { type: :string },
                account: { "$ref" => "#/components/schemas/Account" },
                user: { "$ref" => "#/components/schemas/SessionUser" }
              }
            },
            AuthAccepted: {
              type: :object,
              required: %w[accepted],
              properties: {
                accepted: { type: :boolean }
              }
            },
            Ok: {
              type: :object,
              required: %w[ok],
              properties: {
                ok: { type: :boolean }
              }
            },
            Passkey: {
              type: :object,
              required: %w[id created_at],
              properties: {
                id: { type: :integer },
                nickname: { type: :string, nullable: true },
                last_used_at: { type: :string, format: :"date-time", nullable: true },
                created_at: { type: :string, format: :"date-time" }
              }
            },
            PasskeyList: {
              type: :object,
              required: %w[passkeys],
              properties: {
                passkeys: { type: :array, items: { "$ref" => "#/components/schemas/Passkey" } }
              }
            },
            WebauthnCredential: {
              type: :object,
              additionalProperties: true
            },
            WebauthnOptions: {
              type: :object,
              required: %w[challenge],
              properties: {
                challenge: { type: :string },
                nonce: { type: :string },
                timeout: { type: :integer },
                rpId: { type: :string },
                userVerification: { type: :string },
                allowCredentials: {
                  type: :array,
                  items: {
                    type: :object,
                    required: %w[id],
                    properties: {
                      id: { type: :string },
                      type: { type: :string }
                    }
                  }
                }
              },
              additionalProperties: true
            }
          }
        }
    }
  }
  config.openapi_format = :yaml
end
