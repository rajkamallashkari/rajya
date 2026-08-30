require "rails_helper"

RSpec.describe Presence::Disconnect do
  include ActiveJob::TestHelper
  include ActiveSupport::Testing::TimeHelpers

  it "schedules offline persist after the grace period when the last tab leaves (BR-44)" do
    user = create(:user)
    Presence::Counter.increment(user.account.id)
    grace = Settings.fetch(:presence_offline_grace)

    freeze_time do
      expect { described_class.call(account: user.account) }
        .to have_enqueued_job(Presence::PersistOfflineJob)
        .with(user.account.id)
        .at(grace.seconds.from_now)
    end
  end

  it "does not schedule persist while another tab remains" do
    user = create(:user)
    Presence::Counter.increment(user.account.id)
    Presence::Counter.increment(user.account.id)

    expect { described_class.call(account: user.account) }
      .not_to have_enqueued_job(Presence::PersistOfflineJob)
  end

  it "uses presence_offline_grace from settings without a restart" do
    user = create(:user)
    Presence::Counter.increment(user.account.id)
    AppSetting.create!(key: "presence_offline_grace", value: 12, category: "realtime")

    freeze_time do
      expect { described_class.call(account: user.account) }
        .to have_enqueued_job(Presence::PersistOfflineJob).at(12.seconds.from_now)
    end
  end
end
