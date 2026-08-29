module Auth
  class Emails
    def self.normalize(value)
      value.to_s.strip.downcase.presence
    end
  end
end
