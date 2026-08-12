FactoryBot.define do
  factory :prompt_template do
    sequence(:capability) { |n| "capability_#{n}" }
    template { "You are a helpful assistant." }
  end
end
