# Uniform success body for enumeration-safe request endpoints (OTP, magic
# link, forgot-password) — existing and missing accounts return this (F-24).
class Auth::Accepted
  def initialize(accepted)
    @accepted = accepted
  end

  attr_reader :accepted
end
