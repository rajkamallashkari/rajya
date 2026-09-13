module Accounts
  class ShowProfile < ApplicationOperation
    Profile = Struct.new(:account, :blocked_by_viewer, :email, :phone, keyword_init: true)

    def call(viewer:, account_id:)
      account = Account.with_attached_avatar.find_by(id: account_id)
      return failure(:not_found) if account.nil? || account.deactivated?
      return failure(:not_found) if account.blocks_initiated.exists?(blocked_account_id: viewer.id)

      blocked_by_viewer = viewer.blocks_initiated.exists?(blocked_account_id: account.id)
      user = account.human? ? account.user : nil
      email = user&.email if account.privacy_flag("show_email_on_profile")
      phone = user&.phone if account.privacy_flag("show_phone_on_profile")
      success(Profile.new(account:, blocked_by_viewer:, email:, phone:))
    end
  end
end
