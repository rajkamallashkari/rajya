module Conversations
  class Update < ApplicationOperation
    def call(account:, conversation:, title: nil, description: :unset,
             member_permissions: :unset, slow_mode_seconds: :unset, restrict_forwarding: :unset)
      return failure(:forbidden) unless ConversationPolicy.new(account, conversation).update?
      return failure(:validation_failed) if title_blank?(title)

      permissions = normalize_permissions(member_permissions)
      return failure(:validation_failed) if permissions == :invalid
      return failure(:validation_failed) unless valid_slow_mode?(slow_mode_seconds)

      previous = snapshot(conversation)
      conversation.title = title unless title.nil?
      conversation.description = description unless description == :unset
      conversation.member_permissions = permissions unless permissions == :unset
      conversation.slow_mode_seconds = slow_mode_seconds unless slow_mode_seconds == :unset
      unless restrict_forwarding == :unset
        conversation.restrict_forwarding = ActiveModel::Type::Boolean.new.cast(restrict_forwarding)
      end
      conversation.save!
      write_system_events!(account, conversation, previous)
      success(Show.call(account: account, conversation: conversation).value)
    end

    private

    def title_blank?(title)
      title.is_a?(String) && title.strip.empty?
    end

    def normalize_permissions(value)
      return :unset if value == :unset

      document = permissions_hash(value)
      return :invalid unless document && MemberPermissions.valid?(document)

      document
    end

    def permissions_hash(value)
      return value.to_unsafe_h.stringify_keys if value.respond_to?(:to_unsafe_h)
      return value.stringify_keys if value.is_a?(Hash)

      nil
    end

    def valid_slow_mode?(value)
      return true if value == :unset

      Array(Settings.fetch(:slow_mode_presets)).map(&:to_i).include?(value.to_i)
    end

    def snapshot(conversation)
      {
        title: conversation.title,
        description: conversation.description,
        member_permissions: conversation.member_permissions,
        slow_mode_seconds: conversation.slow_mode_seconds,
        restrict_forwarding: conversation.restrict_forwarding
      }
    end

    def write_system_events!(account, conversation, previous)
      write_title_event!(account, conversation, previous)
      write_description_event!(account, conversation, previous)
      write_permissions_event!(account, conversation, previous)
      write_slow_mode_event!(account, conversation, previous)
      write_forwarding_event!(account, conversation, previous)
    end

    def write_title_event!(account, conversation, previous)
      return unless conversation.title_previously_changed? && conversation.title != previous[:title]

      SystemEvents::Write.call(
        conversation: conversation, event: "title_changed", actor: account,
        payload: { title: conversation.title, name: account.display_name }
      )
    end

    def write_description_event!(account, conversation, previous)
      return unless conversation.description_previously_changed? &&
                    conversation.description != previous[:description]

      SystemEvents::Write.call(
        conversation: conversation, event: "description_changed", actor: account,
        payload: { name: account.display_name }
      )
    end

    def write_permissions_event!(account, conversation, previous)
      return unless conversation.member_permissions.as_json != previous[:member_permissions].as_json

      SystemEvents::Write.call(
        conversation: conversation, event: "permissions_changed", actor: account,
        payload: { name: account.display_name }
      )
    end

    def write_slow_mode_event!(account, conversation, previous)
      return unless conversation.slow_mode_seconds != previous[:slow_mode_seconds]

      SystemEvents::Write.call(
        conversation: conversation, event: "slow_mode_changed", actor: account,
        payload: { name: account.display_name }
      )
    end

    def write_forwarding_event!(account, conversation, previous)
      return if conversation.restrict_forwarding == previous[:restrict_forwarding]

      event = conversation.restrict_forwarding ? "forwarding_restricted" : "forwarding_unrestricted"
      SystemEvents::Write.call(
        conversation: conversation, event: event, actor: account,
        payload: { name: account.display_name }
      )
    end
  end
end
