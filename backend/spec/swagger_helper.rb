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
          }
        }
      }
    }
  }
  config.openapi_format = :yaml
end
