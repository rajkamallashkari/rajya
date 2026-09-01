module Users
  class Show < ApplicationOperation
    def call(user:, account: nil)
      success(Me.new(account: account || user.account, user: user))
    end
  end
end
