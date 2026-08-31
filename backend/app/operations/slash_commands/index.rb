module SlashCommands
  class Index < ApplicationOperation
    def call(conversation:)
      return failure(:not_found) if conversation.nil?

      success(List.new(commands: Builtins.entries + bot_entries(conversation)))
    end

    private

    def bot_entries(conversation)
      BotCommand.where(bot_id: active_bot_ids(conversation))
                .includes(bot: :account)
                .order(:position, :name, :id)
                .map { |row| entry_for(row) }
    end

    def active_bot_ids(conversation)
      Bot.active.joins(account: :conversation_memberships)
         .merge(ConversationMembership.active.where(conversation_id: conversation.id))
         .select(:id)
    end

    def entry_for(row)
      Entry.new(
        name: row.name.to_s,
        description: row.description,
        usage_hint: row.usage_hint,
        source: "bot",
        bot_account_id: row.bot.account_id,
        client_action: nil
      )
    end
  end
end
