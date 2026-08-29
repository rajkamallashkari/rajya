class SessionResource < ApplicationResource
  attributes :token

  one :account, resource: AccountResource
  one :user, resource: SessionUserResource
end
