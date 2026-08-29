class ContactNicknameResource < ApplicationResource
  attributes :nickname

  attribute :account do
    AccountResource.new(object.target_account).to_h
  end
end
