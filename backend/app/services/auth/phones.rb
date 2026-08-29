# Canonical phone storage for profile/discovery (D-6). WhatsApp sends digits
# without punctuation; admin entry is normalised to the same shape so uniqueness
# and the sender-wins rule compare equal values.
module Auth
  class Phones
    NON_DIGITS = /\D/

    def self.normalize(value)
      value.to_s.gsub(NON_DIGITS, "").presence
    end
  end
end
