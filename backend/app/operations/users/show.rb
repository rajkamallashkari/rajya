module Users
  class Show < ApplicationOperation
    def call(user:, account: nil)
      profile = account || user.account
      profile.association(:avatar_attachment).load_target
      success(Me.new(account: profile, user: user))
    end
  end
end
