module SlashCommands
  # Parsed prefix of an ordinary message body (NR-45). Mentions stay on
  # `<@account_id>`; commands are `/name` plus optional arguments.
  class Parser
    PATTERN = %r{\A/([a-z0-9_]{1,32})(?:\s+(.*))?\z}i

    Result = Struct.new(:name, :arguments, keyword_init: true)

    def self.parse(text)
      match = text.to_s.strip.match(PATTERN)
      return if match.nil?

      Result.new(name: match[1].downcase, arguments: match[2].to_s.strip)
    end
  end
end
