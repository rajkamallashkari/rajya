module Blocks
  class Create < ApplicationOperation
    def call(blocker:, blocked_id:)
      blocked = Account.find_by(id: blocked_id)
      return failure(:not_found) if blocked.nil?
      return failure(:validation_failed) if blocker.id == blocked.id
      return failure(:conflict) if Block.exists?(blocker_account: blocker, blocked_account: blocked)

      block = Block.create!(blocker_account: blocker, blocked_account: blocked)
      success(block)
    end
  end
end
