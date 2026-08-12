FactoryBot.define do
  factory :audit_event do
    action { "account.deactivated" }
  end
end
