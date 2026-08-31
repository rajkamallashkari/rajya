class TranslationResource < ApplicationResource
  attributes :text, :source_language, :target_language, :cached
end
