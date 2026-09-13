require "rails_helper"

# rubocop:disable RSpec/ExampleLength -- Avatar lifecycle setup and assertions belong together.
RSpec.describe Bots::Requests::Create do
  def prompt
    "A" * Ai::Limits.prompt_minimum_length
  end

  it "creates a pending proposal when the builder flag is on (BR-80)" do
    user = create(:user)
    result = described_class.call(
      requester: user.account, kind: "create",
      payload: { name: "Nimbus", username: "nimbus_bot", bio: "Weather pal", persona_prompt: prompt }
    )

    expect(result).to be_success
    expect(result.value).to have_attributes(kind: "create", status: "pending")
    expect(result.value.proposed_persona_prompt.length).to eq(Ai::Limits.prompt_minimum_length)
  end

  it "stages a valid avatar and rejects invalid avatar content" do
    user = create(:user)
    payload = { name: "Nimbus", username: "nimbus_bot", bio: "Weather pal", persona_prompt: prompt }
    image = blob_signed_id

    result = described_class.call(
      requester: user.account, kind: "create", payload: payload,
      avatar: image, avatar_provided: true
    )
    expect(result.value.avatar).to be_attached
    expect(result.value.avatar_action).to eq("replace")

    invalid = blob_signed_id(filename: "bot.pdf", content_type: "application/pdf")
    rejected = described_class.call(
      requester: user.account, kind: "create", payload: payload.merge(username: "other_bot"),
      avatar: invalid, avatar_provided: true
    )
    expect(rejected.error_code).to eq(:validation_failed)
  end

  it "rejects a short persona prompt and an edit of someone else's bot" do
    user = create(:user)
    short = described_class.call(
      requester: user.account, kind: "create",
      payload: { name: "X", username: "xyzbot", bio: "Hi", persona_prompt: "too short" }
    )
    expect(short.error_code).to eq(:validation_failed)

    other = create(:bot, owner_account: create(:user).account)
    stolen = described_class.call(
      requester: user.account, kind: "edit", target_bot_id: other.id,
      payload: { name: "X", username: other.account.username, bio: "Hi", persona_prompt: prompt }
    )
    expect(stolen.error_code).to eq(:forbidden)
  end

  it "defaults a blank kind to create and accepts request parameters" do
    user = create(:user)
    result = described_class.call(
      requester: user.account, kind: nil,
      payload: ActionController::Parameters.new(
        "name" => "Nimbus", "username" => "nimbusok", "bio" => "Sky", "persona_prompt" => prompt
      )
    )
    expect(result.value.kind).to eq("create")
  end

  it "rejects an unknown kind and blank required fields" do # rubocop:disable RSpec/ExampleLength, RSpec/MultipleExpectations
    user = create(:user)
    expect(
      described_class.call(
        requester: user.account, kind: "clone",
        payload: { name: "X", username: "xyzbotok", bio: "Hi", persona_prompt: prompt }
      ).error_code
    ).to eq(:validation_failed)
    expect(
      described_class.call(
        requester: user.account, kind: "create",
        payload: { name: "", username: "xyzbotok", bio: "Hi", persona_prompt: prompt }
      ).error_code
    ).to eq(:validation_failed)
    expect(
      described_class.call(
        requester: user.account, kind: "create",
        payload: { name: "X", username: "", bio: "Hi", persona_prompt: prompt }
      ).error_code
    ).to eq(:validation_failed)
    expect(
      described_class.call(
        requester: user.account, kind: "create",
        payload: { name: "X", username: "bad name", bio: "Hi", persona_prompt: prompt }
      ).error_code
    ).to eq(:validation_failed)
    expect(
      described_class.call(
        requester: user.account, kind: "create",
        payload: { name: "X", username: "xyzbotok", bio: "", persona_prompt: prompt }
      ).error_code
    ).to eq(:validation_failed)
  end

  it "rejects a missing edit target" do
    user = create(:user)
    expect(
      described_class.call(
        requester: user.account, kind: "edit", target_bot_id: 0,
        payload: { name: "X", username: "xyzbotok", bio: "Hi", persona_prompt: prompt }
      ).error_code
    ).to eq(:not_found)
  end

  it "rejects a duplicate pending edit" do
    user = create(:user)
    bot = create(:bot, owner_account: user.account)
    described_class.call(
      requester: user.account, kind: "edit", target_bot_id: bot.id,
      payload: { name: "X", username: bot.account.username, bio: "Hi", persona_prompt: prompt }
    )
    duplicate = described_class.call(
      requester: user.account, kind: "edit", target_bot_id: bot.id,
      payload: { name: "Y", username: bot.account.username, bio: "Hi", persona_prompt: prompt }
    )
    expect(duplicate.error_code).to eq(:conflict)
  end

  it "maps a database uniqueness race to conflict" do
    user = create(:user)
    allow(BotRequest).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique)

    result = described_class.call(
      requester: user.account, kind: "create",
      payload: { name: "Nimbus", username: "nimbus_bot", bio: "Weather pal", persona_prompt: prompt }
    )

    expect(result.error_code).to eq(:conflict)
  end

  it "returns not_found when bot_builder is off" do
    user = create(:user)
    create(:feature_flag, key: "bot_builder", description: FeatureFlagRegistry.description_for(:bot_builder),
                           enabled: false)
    expect(
      described_class.call(
        requester: user.account, kind: "create",
        payload: { name: "Z", username: "zedbotok", bio: "Hi", persona_prompt: prompt }
      ).error_code
    ).to eq(:not_found)
  end
end
# rubocop:enable RSpec/ExampleLength
