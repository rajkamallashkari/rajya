module Blocks
  List = Struct.new(:blocks, keyword_init: true)

  class Index < ApplicationOperation
    def call(blocks:)
      success(List.new(blocks: blocks.includes(:blocked_account).to_a))
    end
  end
end
