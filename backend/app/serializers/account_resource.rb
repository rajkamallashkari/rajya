class AccountResource < ApplicationResource
  attributes :id, :username, :display_name, :kind, :bio

  attribute :shared_memory do
    object.bot?
  end
end
