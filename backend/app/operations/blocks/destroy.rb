module Blocks
  class Destroy < ApplicationOperation
    def call(block:)
      block.destroy!
      success(nil)
    end
  end
end
