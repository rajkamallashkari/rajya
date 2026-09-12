class AccountResource < ApplicationResource
  attributes :id, :username, :display_name, :kind, :bio

  attribute :avatar_url do
    next unless object.association(:avatar_attachment).loaded?
    next unless object.avatar.attached?

    Rails.application.routes.url_helpers.rails_blob_path(object.avatar, only_path: true)
  end

  attribute :shared_memory do
    object.bot?
  end
end
