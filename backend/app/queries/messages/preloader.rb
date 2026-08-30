module Messages
  module Preloader
    ASSOCIATIONS = [ :sender_account, :attachments, :reply_to_message ].freeze

    def self.apply(scope)
      scope.includes(*ASSOCIATIONS)
    end
  end
end
