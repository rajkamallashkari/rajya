# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

Catalog::Seeder.seed!
Bots::Import.call

# Presign routes through Storage::BucketRouter (BR-91), which fails closed with
# quota_exceeded unless an active bucket exists for the configured Active
# Storage service. Without this row every attachment and voice note is dropped.
StorageBucket.find_or_create_by!(service_name: Rails.application.config.active_storage.service.to_s) do |bucket|
  bucket.capacity_bytes = Settings.fetch(:global_quota_bytes)
end
