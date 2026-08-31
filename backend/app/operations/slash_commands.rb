module SlashCommands
  Entry = Struct.new(
    :name, :description, :usage_hint, :source, :bot_account_id, :client_action,
    keyword_init: true
  )
  List = Struct.new(:commands, keyword_init: true)
end
