module Bots
  class Vector
    def self.literal(values)
      floats = Array(values).map { |value| Float(value) }
      "[#{floats.join(",")}]"
    end

    def self.quoted(values)
      BotMemory.connection.quote(literal(values))
    end
  end
end
