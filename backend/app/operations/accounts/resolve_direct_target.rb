module Accounts
  class ResolveDirectTarget < ApplicationOperation
    def call(creator:, account_id: nil, username: nil)
      return failure(:validation_failed) if account_id.present? && username.present?
      return success(creator) if account_id.blank? && username.blank?

      account = if username.present?
                  username_column = Account.arel_table[:username]
                  Account.active.find_by(username_column.lower.eq(username.to_s.downcase))
      else
                  Account.active.find_by(id: account_id)
      end

      account ? success(account) : failure(:not_found)
    end
  end
end
