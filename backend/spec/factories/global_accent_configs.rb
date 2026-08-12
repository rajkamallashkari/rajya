FactoryBot.define do
  factory :global_accent_config do
    # `id` is an app-assigned string slug here (SCHEMA_DESIGN.md §8), not a
    # DB-generated surrogate key, so it must be set explicitly.
    id { "accent-#{SecureRandom.hex(4)}" }
    label { "Ocean" }
    hex { "#336699" }
  end
end
