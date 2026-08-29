class MeResource < ApplicationResource
  one :account, resource: AccountResource
  one :user, resource: SessionUserResource
end
