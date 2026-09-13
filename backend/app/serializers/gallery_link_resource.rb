class GalleryLinkResource < ApplicationResource
  attributes :url, :title, :description, :site_name

  attribute :message_id do
    object.message.id
  end

  attribute :sender do
    account = object.message.sender_account
    account && AccountResource.new(account).to_h
  end

  attribute :sent_at do
    object.message.created_at
  end
end
