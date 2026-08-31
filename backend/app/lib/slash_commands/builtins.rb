module SlashCommands
  # App-owned commands that always appear in the `/` menu (NR-45). Picker
  # actions stay on the client; `/help` is sent as an ordinary message.
  class Builtins
    STICKER = "sticker"
    GIF = "gif"
    HELP = "help"
    NAMES = [ STICKER, GIF, HELP ].freeze
    OPEN_GIF_PICKER = "open_gif_picker"
    OPEN_STICKER_PICKER = "open_sticker_picker"
    CLIENT_ACTIONS = {
      GIF => OPEN_GIF_PICKER,
      STICKER => OPEN_STICKER_PICKER
    }.freeze

    def self.reserved?(name)
      NAMES.include?(name.to_s.downcase)
    end

    def self.client_only?(name)
      CLIENT_ACTIONS.key?(name.to_s.downcase)
    end

    def self.entries
      NAMES.map { |name| entry_for(name) }
    end

    def self.entry_for(name)
      SlashCommands::Entry.new(
        name: name,
        description: Catalog.t("slash.builtins.#{name}"),
        usage_hint: nil,
        source: "builtin",
        bot_account_id: nil,
        client_action: CLIENT_ACTIONS[name]
      )
    end
  end
end
