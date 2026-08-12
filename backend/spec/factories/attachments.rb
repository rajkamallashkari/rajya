FactoryBot.define do
  factory :attachment do
    message
    kind { "image" }
    content_type { "image/png" }
    byte_size { 1024 }
  end
end
