class JoinRequestResource < ApplicationResource
  attributes :id, :status, :created_at

  attribute :account do
    AccountResource.new(object.account).to_h
  end
end
