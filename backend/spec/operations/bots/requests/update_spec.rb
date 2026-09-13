require "rails_helper"

# rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations -- One operation has a compact lifecycle matrix.
RSpec.describe Bots::Requests::Update do
  def valid_payload
    {
      name: "Nimbus", username: "nimbus_bot", bio: "Weather pal",
      persona_prompt: "A" * Ai::Limits.prompt_minimum_length
    }
  end

  it "updates a pending request owned by the actor" do
    user = create(:user)
    request = create(:bot_request, requester_account: user.account)

    result = described_class.call(actor: user.account, request: request, payload: valid_payload)

    expect(result).to be_success
    expect(request.reload.proposed_name).to eq("Nimbus")
  end

  it "resubmits a declined request without replacing it" do
    user = create(:user)
    request = create(
      :bot_request,
      requester_account: user.account,
      status: "declined",
      decline_reason: "Needs more detail"
    )

    result = described_class.call(actor: user.account, request: request, payload: valid_payload)

    expect(result).to be_success
    expect(request.reload).to have_attributes(
      id: result.value.id,
      status: "pending",
      decline_reason: nil,
      proposed_name: "Nimbus"
    )
  end

  it "stages, removes, and validates avatar changes" do
    user = create(:user)
    request = create(:bot_request, requester_account: user.account)
    image = blob_signed_id

    result = described_class.call(
      actor: user.account, request: request, payload: valid_payload,
      avatar: image, avatar_provided: true
    )
    expect(result.value.avatar).to be_attached
    expect(request.reload.avatar_action).to eq("replace")

    removed = described_class.call(
      actor: user.account, request: request, payload: valid_payload,
      avatar: nil, avatar_provided: true
    )
    expect(removed.value.avatar).not_to be_attached
    expect(request.reload.avatar_action).to eq("remove")

    invalid = blob_signed_id(filename: "bad.pdf", content_type: "application/pdf")
    rejected = described_class.call(
      actor: user.account, request: request, payload: valid_payload,
      avatar: invalid, avatar_provided: true
    )
    expect(rejected.error_code).to eq(:validation_failed)
  end

  it "refuses non-owners, approved requests, missing requests, and invalid payloads" do
    owner = create(:user)
    request = create(:bot_request, requester_account: owner.account)
    outsider = create(:user)

    expect(
      described_class.call(actor: outsider.account, request: request, payload: valid_payload).error_code
    ).to eq(:forbidden)
    request.update!(status: "approved")
    expect(
      described_class.call(actor: owner.account, request: request, payload: valid_payload).error_code
    ).to eq(:conflict)
    expect(
      described_class.call(actor: owner.account, request: nil, payload: valid_payload).error_code
    ).to eq(:not_found)
    request.update!(status: "pending")
    expect(
      described_class.call(actor: owner.account, request: request, payload: {}).error_code
    ).to eq(:validation_failed)
  end
end
# rubocop:enable RSpec/ExampleLength, RSpec/MultipleExpectations
