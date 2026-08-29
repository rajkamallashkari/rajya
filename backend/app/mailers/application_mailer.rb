class ApplicationMailer < ActionMailer::Base
  default from: -> { ApplicationMailer.default_from_address }
  layout "mailer"

  def self.default_from_address
    address = Settings.fetch(:email_from_address)
    name = Settings.fetch(:email_from_name)
    email_address_with_name(address, name)
  end
end
