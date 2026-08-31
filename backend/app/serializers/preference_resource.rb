class PreferenceResource < ApplicationResource
  attributes :data

  attribute :updated_at do
    object.updated_at&.iso8601
  end
end
