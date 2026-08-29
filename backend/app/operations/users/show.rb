module Users
  class Show < ApplicationOperation
    def call(user:)
      success(Me.new(account: user.account, user: user))
    end
  end
end
