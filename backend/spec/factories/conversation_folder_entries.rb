FactoryBot.define do
  factory :conversation_folder_entry do
    folder factory: %i[conversation_folder]
    conversation
  end
end
