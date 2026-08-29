class BlockResource < ApplicationResource
  attribute :account do
    AccountResource.new(object.blocked_account).to_h
  end
end
