# Mention tokens stored in message bodies (NR-35). Account mentions keep the
# Slack/Discord `<@id>` shape from the legacy dispatcher; `@everyone` and
# `@admins` are special tokens behind `mention_everyone`.
module Mentions
  class Parser
    ACCOUNT_TOKEN = /<@(\d+)>/
    SPECIAL_TOKEN = /<@(everyone|admins)>/
    SPECIAL_BARE = /(?<![A-Za-z0-9_])@(everyone|admins)\b/

    Result = Struct.new(:account_ids, :everyone, :admins, keyword_init: true) do
      def special?
        everyone || admins
      end
    end

    def self.parse(text)
      new(text).parse
    end

    def initialize(text)
      @text = text.to_s
    end

    def parse
      Result.new(
        account_ids: @text.scan(ACCOUNT_TOKEN).flatten.map(&:to_i).uniq,
        everyone: special?("everyone"),
        admins: special?("admins")
      )
    end

    private

    def special?(name)
      @text.scan(SPECIAL_TOKEN).flatten.include?(name) ||
        @text.scan(SPECIAL_BARE).flatten.include?(name)
    end
  end
end
