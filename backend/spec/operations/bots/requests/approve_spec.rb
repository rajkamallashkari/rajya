require "rails_helper"

# rubocop:disable RSpec/ExampleLength
RSpec.describe Bots::Requests::Approve do
  def prompt
    "A" * Ai::Limits.prompt_minimum_length
  end

  it "materialises a user-owned bot on create approval (BR-82 owner set)" do
    admin = create(:user, :admin)
    requester = create(:user)
    request = create(
      :bot_request, requester_account: requester.account, kind: "create",
      payload: { "name" => "Nimbus", "username" => "nimbus_bot", "bio" => "Sky", "persona_prompt" => prompt }
    )

    bot = described_class.call(admin: admin, request: request).value

    expect(bot.owner_account_id).to eq(requester.account_id)
    expect(bot.account.username).to eq("nimbus_bot")
    expect(request.reload.status).to eq("approved")
  end

  it "applies an edit and refuses a non-admin" do
    admin = create(:user, :admin)
    owner = create(:user)
    bot = create(:bot, owner_account: owner.account, persona_prompt: prompt)
    request = create(
      :bot_request, requester_account: owner.account, kind: "edit", target_bot: bot,
      payload: { "name" => "Renamed", "username" => bot.account.username, "bio" => "New", "persona_prompt" => prompt }
    )

    described_class.call(admin: admin, request: request)
    expect(bot.account.reload.display_name).to eq("Renamed")

    stranger = create(:user)
    pending = create(
      :bot_request, requester_account: owner.account, kind: "create",
      payload: { "name" => "Zed", "username" => "zed_bot_ok", "bio" => "Hi", "persona_prompt" => prompt }
    )
    expect(described_class.call(admin: stranger, request: pending).error_code).to eq(:forbidden)
  end

  it "refuses a second approval, a missing request, and a taken username" do
    admin = create(:user, :admin)
    taken = create(:account, username: "taken_bot")
    request = create(
      :bot_request, requester_account: create(:user).account, kind: "create",
      payload: { "name" => "Nimbus", "username" => taken.username, "bio" => "Sky", "persona_prompt" => prompt }
    )
    expect(described_class.call(admin: admin, request: request).error_code).to eq(:validation_failed)
    expect(described_class.call(admin: admin, request: nil).error_code).to eq(:not_found)

    approved = create(
      :bot_request, requester_account: create(:user).account, kind: "create", status: "approved",
      payload: { "name" => "Ok", "username" => "ok_bot_ok", "bio" => "Sky", "persona_prompt" => prompt }
    )
    expect(described_class.call(admin: admin, request: approved).error_code).to eq(:conflict)
  end

  it "refuses an edit without a target bot" do
    admin = create(:user, :admin)
    request = create(
      :bot_request, requester_account: create(:user).account, kind: "edit",
      payload: { "name" => "X", "username" => "editbotok", "bio" => "Hi", "persona_prompt" => prompt }
    )
    expect(described_class.call(admin: admin, request: request).error_code).to eq(:validation_failed)
  end

  it "refuses an edit onto a taken username" do
    admin = create(:user, :admin)
    owner = create(:user)
    bot = create(:bot, owner_account: owner.account, persona_prompt: prompt)
    taken = create(:account, username: "takenbotok")
    request = create(
      :bot_request, requester_account: owner.account, kind: "edit", target_bot: bot,
      payload: {
        "name" => "X", "username" => taken.username, "bio" => "Hi", "persona_prompt" => prompt
      }
    )
    expect(described_class.call(admin: admin, request: request).error_code).to eq(:validation_failed)
  end
end
# rubocop:enable RSpec/ExampleLength
