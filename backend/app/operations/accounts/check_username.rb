module Accounts
  class CheckUsername < ApplicationOperation
    Availability = Struct.new(:available, keyword_init: true)

    def call(username:, except_id: nil)
      success(Availability.new(available: Auth::Usernames.available?(username.to_s.strip, except_id: except_id)))
    end
  end
end
