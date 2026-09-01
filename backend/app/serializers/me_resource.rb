class MeResource < ApplicationResource
  one :account, resource: AccountResource
  one :user, resource: SessionUserResource

  attribute :impersonation do
    id = params[:impersonator_id]
    next unless id

    {
      "impersonator_id" => id,
      "account_id" => object.account.id,
      "display_name" => object.account.display_name
    }
  end
end
