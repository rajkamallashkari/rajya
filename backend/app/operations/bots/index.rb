module Bots
  Catalog = Struct.new(:bots, keyword_init: true)

  class Index < ApplicationOperation
    def call
      bots = Bot.active.includes(:account, :owner_account).order(:id)
      success(Catalog.new(bots: bots.to_a))
    end
  end
end
