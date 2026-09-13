module Bots
  module Requests
    module Avatar
      ALLOWED_CONTENT_TYPES = %w[image/gif image/jpeg image/png image/webp].freeze
      MAX_BYTES = 5.megabytes # rubocop:disable Rajya/NoMagicNumbers -- Product avatar limit is fixed at 5 MB.

      module_function

      def stage!(request, value:, provided:)
        return true unless provided

        blob = ActiveStorage::Blob.find_signed(value.to_s) if value.present?
        return false if value.present? && !valid?(blob)

        request.avatar.purge if request.avatar.attached?
        if value.blank?
          request.update!(avatar_action: "remove")
          return true
        end

        request.avatar.attach(blob)
        request.update!(avatar_action: "replace")
        true
      end

      def apply!(request, account)
        case request.avatar_action
        when "remove"
          account.avatar.purge if account.avatar.attached?
        when "replace"
          blob = request.avatar.blob
          account.avatar.purge if account.avatar.attached?
          account.avatar.attach(blob)
          request.avatar.detach
        end
      end

      def cleanup!(request)
        request.avatar.purge if request.avatar.attached?
      end

      def valid?(blob)
        blob.present? &&
          ALLOWED_CONTENT_TYPES.include?(blob.content_type) &&
          blob.byte_size <= MAX_BYTES
      end
    end
  end
end
