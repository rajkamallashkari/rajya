FactoryBot.define do
  factory :export_job do
    account
    format { "json" }
    include_media { false }
    status { "pending" }
    expires_at { 1.day.from_now }
  end
end
