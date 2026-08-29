class ContactNicknameListResource < ApplicationResource
  attribute :nicknames do
    object.nicknames.map { |nickname| ContactNicknameResource.new(nickname).to_h }
  end
end
