module Users
  class CompleteOnboarding < ApplicationOperation
    def call(user:)
      user.update!(onboarded_at: user.onboarded_at || Time.current)
      success(Me.new(account: user.account, user: user.reload))
    end
  end
end
