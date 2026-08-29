# The success payload every login path returns — JWT plus the participant
# and human rows the client needs to bootstrap. Serialised by SessionResource.
module Auth
  class Session
    Payload = Struct.new(:token, :account, :user, keyword_init: true)

    def self.issue(user)
      Payload.new(token: Token.encode(user), account: user.account, user: user)
    end
  end
end
