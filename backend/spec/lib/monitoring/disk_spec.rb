require "rails_helper"

RSpec.describe Monitoring::Disk do
  it "parses POSIX df -k -P output into byte counts and a percent" do
    output = <<~DF
      Filesystem     1024-blocks      Used Available Capacity Mounted on
      /dev/sda1            10000      8000      2000      80% /
    DF

    sample = described_class.parse("/", output)
    expect(sample.ok).to be(true)
    expect(sample.percent).to eq(80)
    expect(sample.used_bytes).to eq(8_000 * 1_024)
    expect(sample.total_bytes).to eq(10_000 * 1_024)
  end

  it "returns an unsuccessful sample when df output is empty" do
    sample = described_class.parse("/", "Filesystem\n")
    expect(sample.ok).to be(false)
    expect(sample.percent).to eq(0)
  end

  it "returns an unsuccessful sample when blocks are not integers" do
    output = <<~DF
      Filesystem     1024-blocks      Used Available Capacity Mounted on
      /dev/sda1              abc       def       ghi      80% /
    DF
    expect(described_class.parse("/", output).ok).to be(false)
  end

  it "rescues probe failures" do
    sample = described_class.sample(path: "/", runner: ->(_) { raise "df down" })
    expect(sample.ok).to be(false)
  end

  it "samples via an injected runner" do
    ok = described_class.sample(
      path: "/",
      runner: lambda { |_|
        <<~DF
          Filesystem     1024-blocks      Used Available Capacity Mounted on
          /dev/sda1            10000      1000      9000      10% /
        DF
      }
    )
    expect(ok.ok).to be(true)
    expect(ok.percent).to eq(10)
  end

  it "samples live df and treats a failed probe as unsuccessful" do
    live = described_class.sample
    expect(live).to be_a(described_class::Sample)

    status = instance_double(Process::Status, success?: false)
    allow(Open3).to receive(:capture2).and_return([ "", status ])
    expect(described_class.sample(path: "/").ok).to be(false)
  end
end
