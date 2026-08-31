module Ai
  StyleProfileView = Struct.new(:enabled, :profile, :updated_at, :message_count, keyword_init: true)

  class StyleProfiles
    class Show < ApplicationOperation
      def call(account:)
        preference = account.preference || account.create_preference!(data: {})
        blob = preference.style_profile
        count = blob.is_a?(Hash) ? blob["message_count_at_generation"].to_i : 0
        success(StyleProfileView.new(
                  enabled: preference.style_profile_enabled?,
                  profile: blob.is_a?(Hash) ? blob["global"] : blob,
                  updated_at: preference.style_profile_updated_at,
                  message_count: count
                ))
      end
    end

    class UpdateConsent < ApplicationOperation
      def call(account:, enabled:)
        preference = account.preference || account.create_preference!(data: {})
        preference.merge_ai!("style_profile_enabled" => ActiveModel::Type::Boolean.new.cast(enabled))
        Show.call(account: account)
      end
    end

    class Build < ApplicationOperation
      def call(account:, force: false)
        preference = account.preference || account.create_preference!(data: {})
        return failure(:forbidden) unless preference.style_profile_enabled?

        messages = sample(account)
        return failure(:validation_failed) if messages.size < Limits.style_profile_min_messages
        return success(Show.call(account: account).value) unless force || rebuild?(preference, account)

        outcome = Complete.call(
          account: account, capability: :style_profile,
          messages: [
            { role: "system", content: PromptTemplate.fetch(:style_profile) },
            { role: "user", content: "Messages:\n#{messages.join("\n")}" }
          ]
        )
        return outcome unless outcome.success?

        write!(preference, outcome.value.text, account)
        Show.call(account: account)
      end

      private

      def sample(account)
        Message.visible.where(sender_account: account, kind: "text")
               .where.not(body: [ nil, "" ])
               .order(created_at: :desc)
               .limit(Limits.style_profile_sample)
               .pluck(:body)
      end

      def rebuild?(preference, account)
        blob = preference.style_profile
        last = blob.is_a?(Hash) ? blob["message_count_at_generation"].to_i : 0
        total = Message.visible.where(sender_account: account, kind: "text").count
        total - last >= Limits.style_profile_rebuild_threshold
      end

      def write!(preference, description, account)
        clipped = description.to_s.strip.truncate(Limits.style_profile_max_length)
        total = Message.visible.where(sender_account: account, kind: "text").count
        preference.merge_ai!(
          "style_profile" => {
            "global" => clipped,
            "generated_at" => Time.current.iso8601,
            "message_count_at_generation" => total
          },
          "style_profile_updated_at" => Time.current.iso8601
        )
      end
    end
  end
end
