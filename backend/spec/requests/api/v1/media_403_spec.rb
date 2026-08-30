require "rails_helper"

RSpec.describe "Session 7.1 media authorization 403s", type: :request do
  # rubocop:disable RSpec/AnyInstance
  def stub_deny(policy, query)
    allow_any_instance_of(policy).to receive(query).and_return(false)
  end
  # rubocop:enable RSpec/AnyInstance

  it "returns 403 on direct upload when the policy denies (F-1)" do
    user = create(:user)
    stub_deny(DirectUploadPolicy, :create?)
    post "/api/v1/direct_uploads", headers: auth_headers_for(user), as: :json, params: {
      filename: "pic.png", byte_size: 4, checksum: Digest::MD5.base64digest("data"), content_type: "image/png"
    }
    expect(response).to have_http_status(:forbidden)
  end

  it "returns 403 on thumbnail when the viewer is not a member (BR-94)" do
    owner = create(:user)
    stranger = create(:user)
    conversation = create_direct_between(owner.account, create(:account))
    attachment = create(:attachment, message: create(:message, conversation: conversation, sender_account: owner.account))
    attachment.file.attach(io: StringIO.new("img"), filename: "pic.png", content_type: "image/png")

    get "/api/v1/attachments/#{attachment.id}/thumbnail", headers: auth_headers_for(stranger)
    expect(response).to have_http_status(:forbidden)
  end
end
