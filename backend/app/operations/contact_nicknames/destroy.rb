module ContactNicknames
  class Destroy < ApplicationOperation
    def call(nickname:)
      nickname.destroy!
      success(nil)
    end
  end
end
