FactoryBot.define do
  factory :conversation_folder do
    account
    sequence(:name) { |n| "Folder #{n}" }
  end
end
