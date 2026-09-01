class AdminTranslationStringResource < ApplicationResource
  attribute :translation_string do
    object.translation_string
  end
end
