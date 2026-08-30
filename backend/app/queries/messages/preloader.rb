module Messages
  module Preloader
    ASSOCIATIONS = [
      :sender_account,
      :attachments,
      :reply_to_message,
      :message_location,
      { message_contacts: :contact_account },
      { poll: [ :poll_options, :poll_votes ] }
    ].freeze

    def self.apply(scope)
      scope.includes(*ASSOCIATIONS)
    end
  end
end
