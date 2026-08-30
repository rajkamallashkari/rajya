require "rails_helper"

RSpec.describe Uploads::Create do
  around do |example|
    ActiveStorage::Current.url_options = { host: "www.example.com" }
    example.run
  ensure
    ActiveStorage::Current.reset
  end

  def checksum_for(bytes)
    Digest::MD5.base64digest(bytes)
  end

  def presign(user, **attrs)
    described_class.call(
      account: user.account,
      filename: "pic.png",
      byte_size: 4,
      checksum: checksum_for("data"),
      content_type: "image/png",
      **attrs
    )
  end

  it "returns a presigned upload against the routed bucket" do
    user = create(:user)
    create(:storage_bucket, service_name: "test")
    result = presign(user)

    expect(result).to be_success
    expect(result.value.skip_upload).to be(false)
    expect(result.value.direct_upload_url).to be_present
    expect(result.value.bucket_service_name).to eq("test")
  end

  it "reuses an existing blob with the same checksum (BR-90)" do
    user = create(:user)
    create(:storage_bucket, service_name: "test")
    bytes = "data"
    blob = ActiveStorage::Blob.create_and_upload!(
      io: StringIO.new(bytes), filename: "pic.png", content_type: "image/png"
    )
    result = presign(user, byte_size: blob.byte_size, checksum: blob.checksum)

    expect(result.value.skip_upload).to be(true)
    expect(result.value.blob_signed_id).to eq(blob.signed_id)
  end

  it "rejects a blocked extension, an oversize file, and missing fields" do
    user = create(:user)
    create(:storage_bucket, service_name: "test")

    expect(presign(user, filename: "hack.exe").error_code).to eq(:validation_failed)
    expect(presign(user, filename: "  ").error_code).to eq(:validation_failed)
    expect(presign(user, byte_size: Settings.fetch(:file_caps).fetch("image") + 1).error_code)
      .to eq(:validation_failed)
    expect(presign(user, checksum: "").error_code).to eq(:validation_failed)
  end

  it "rejects oversize video, audio, and other files (BR-88)" do
    user = create(:user)
    create(:storage_bucket, service_name: "test")
    caps = Settings.fetch(:file_caps)

    expect(presign(user, filename: "a.mp4", content_type: "video/mp4",
                        byte_size: caps.fetch("video") + 1).error_code).to eq(:validation_failed)
    expect(presign(user, filename: "a.mp3", content_type: "audio/mpeg",
                        byte_size: caps.fetch("audio") + 1).error_code).to eq(:validation_failed)
    expect(presign(user, filename: "a.zip", content_type: "application/zip",
                        byte_size: caps.fetch("other") + 1).error_code).to eq(:validation_failed)
  end

  it "rejects an upload that would exceed the account quota (BR-87)" do
    user = create(:user)
    create(:storage_bucket, service_name: "test")
    create(:storage_quota, account: user.account, quota_bytes: 3, used_bytes: 0)

    expect(presign(user, byte_size: 4).error_code).to eq(:quota_exceeded)
  end

  it "rejects when no bucket has capacity" do
    user = create(:user)
    create(:storage_bucket, :full, service_name: "test")

    expect(presign(user).error_code).to eq(:quota_exceeded)
  end

  it "rejects when the global quota is exhausted (BR-87)" do
    user = create(:user)
    cap = Settings.fetch(:global_quota_bytes)
    create(:storage_bucket, service_name: "test", used_bytes: cap, capacity_bytes: cap + 100)

    expect(presign(user).error_code).to eq(:quota_exceeded)
  end

  it "returns not_found when direct uploads are disabled" do
    user = create(:user)
    create(:feature_flag, key: "direct_uploads",
                          description: FeatureFlagRegistry.description_for(:direct_uploads), enabled: false)

    expect(presign(user).error_code).to eq(:not_found)
  end
end
