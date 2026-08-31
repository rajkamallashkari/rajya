class AccountSearchResource < ApplicationResource
  attribute :accounts do
    object.accounts.map { |account| AccountResource.new(account).to_h }
  end
end
