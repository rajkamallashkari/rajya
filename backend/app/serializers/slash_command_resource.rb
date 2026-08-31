class SlashCommandResource < ApplicationResource
  attributes :name, :description, :usage_hint, :source, :bot_account_id, :client_action
end
