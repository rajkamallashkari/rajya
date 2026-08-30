require "rails_helper"

RSpec.describe DirectUploadResource do
  it "exposes the presign payload" do
    payload = Uploads::ResultPayload.new(
      blob_signed_id: "sid", direct_upload_url: "https://r2.example/put",
      headers: { "Content-Type" => "image/png" }, bucket_service_name: "test", skip_upload: false
    )
    json = described_class.new(payload).to_h

    expect(json).to include("blob_signed_id" => "sid", "skip_upload" => false, "bucket_service_name" => "test")
  end
end
