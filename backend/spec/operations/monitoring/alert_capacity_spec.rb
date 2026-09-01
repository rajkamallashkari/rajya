require "rails_helper"

RSpec.describe Monitoring::AlertCapacity do
  after { Rails.cache.clear }

  it "mails admins when a bucket is at or above the alert threshold" do
    create(:user, :admin, email: "ops@example.com")
    create(:user, email: "human@example.com")
    create(:storage_bucket, service_name: "r2", used_bytes: 8, capacity_bytes: 10)
    allow(Monitoring::Disk).to receive(:sample).and_return(
      Monitoring::Disk::Sample.new(path: "/", used_bytes: 0, total_bytes: 10, percent: 0, ok: true)
    )

    expect { described_class.call }.to change { ActionMailer::Base.deliveries.size }.by(1)
    expect(ActionMailer::Base.deliveries.last.to).to eq([ "ops@example.com" ])
  end

  it "mails when disk usage crosses the threshold and respects the cooldown" do
    create(:user, :admin, email: "ops@example.com")
    create(:storage_bucket, service_name: "r2", used_bytes: 1, capacity_bytes: 100)
    allow(Monitoring::Disk).to receive(:sample).and_return(
      Monitoring::Disk::Sample.new(path: "/", used_bytes: 9, total_bytes: 10, percent: 90, ok: true)
    )

    expect { described_class.call }.to change { ActionMailer::Base.deliveries.size }.by(1)
    expect { described_class.call }.not_to(change { ActionMailer::Base.deliveries.size })
  end

  it "skips disk samples that failed to probe" do
    create(:user, :admin, email: "ops@example.com")
    allow(Monitoring::Disk).to receive(:sample).and_return(
      Monitoring::Disk::Sample.new(path: "/", used_bytes: 0, total_bytes: 0, percent: 0, ok: false)
    )

    expect { described_class.call }.not_to(change { ActionMailer::Base.deliveries.size })
  end
end
