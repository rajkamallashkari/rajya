require "rails_helper"

RSpec.describe ExportJobPolicy do
  it "allows the owner to read and download their export" do
    user = create(:user)
    job = create(:export_job, account: user.account)

    expect(described_class.new(user.account, ExportJob)).to be_index
    expect(described_class.new(user.account, ExportJob)).to be_create
    expect(described_class.new(user.account, job)).to be_show
    expect(described_class.new(user.account, job)).to be_download
  end

  it "denies a stranger and a bot" do
    owner = create(:user)
    stranger = create(:user)
    job = create(:export_job, account: owner.account)

    expect(described_class.new(stranger.account, job)).not_to be_show
    expect(described_class.new(stranger.account, job)).not_to be_download
    expect(described_class.new(create(:bot).account, ExportJob)).not_to be_create
    expect(described_class.new(nil, job)).not_to be_show
  end

  it "scopes jobs to the acting account" do
    user = create(:user)
    mine = create(:export_job, account: user.account)
    create(:export_job)

    expect(described_class::Scope.new(user.account, ExportJob.all).resolve).to contain_exactly(mine)
    expect(described_class::Scope.new(nil, ExportJob.all).resolve).to be_empty
  end
end
