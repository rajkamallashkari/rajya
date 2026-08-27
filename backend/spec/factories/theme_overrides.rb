FactoryBot.define do
  factory :theme_override do
    theme { "light" }
    token_name { "--text-primary" }
    value { "#1E293B" }
  end
end
