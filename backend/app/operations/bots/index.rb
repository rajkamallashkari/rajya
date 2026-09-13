module Bots
  Catalog = Struct.new(:bots, keyword_init: true)

  class Index < ApplicationOperation
    def call(actor: nil, owned: false)
      bots = Bot.active.includes(:owner_account, account: { avatar_attachment: :blob }).order(:id)
      bots = bots.where(owner_account_id: actor.id) if owned
      success(Catalog.new(bots: bots.to_a))
    end
  end
end
