class AccountProfileResource < ApplicationResource
  attributes :blocked_by_viewer

  attribute :email, if: proc { |profile| profile.email.present? } do |profile|
    profile.email
  end

  attribute :phone, if: proc { |profile| profile.phone.present? } do |profile|
    profile.phone
  end

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

  attribute :avatar_url do
    AccountResource.new(object.account).to_h["avatar_url"]
  end

  attribute :shared_memory do
    object.account.bot?
  end
end
