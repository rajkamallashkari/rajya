module Messages
  module Preloader
    ASSOCIATIONS = [
      :attachments,
      :reply_to_message,
      :message_location,
      { sender_account: [ avatar_attachment: :blob ] },
      { message_contacts: :contact_account },
      { poll: [ :poll_options, :poll_votes ] }
    ].freeze

    def self.apply(scope)
      scope.includes(*ASSOCIATIONS)
    end
  end
end
