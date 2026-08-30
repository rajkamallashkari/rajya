class ReactionDetailsResource < ApplicationResource
  attribute :reactions do
    object.reactions.map do |reaction|
      {
        "emoji" => reaction.emoji,
        "account" => AccountResource.new(reaction.account).to_h
      }
    end
  end
end
