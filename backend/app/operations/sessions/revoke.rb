module Sessions
  class Revoke < ApplicationOperation
    def call(session:)
      session.revoke!
      success(nil)
    end
  end
end
