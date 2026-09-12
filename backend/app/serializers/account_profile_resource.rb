class AccountProfileResource < ApplicationResource
  attributes :blocked_by_viewer

  attribute :id do
    object.account.id
  end

  attribute :username do
    object.account.username
  end

  attribute :display_name do
    object.account.display_name
  end

  attribute :kind do
    object.account.kind
  end

  attribute :bio do
    object.account.bio
  end

  attribute :shared_memory do
    object.account.bot?
  end
end
