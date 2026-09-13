require "rails_helper"

RSpec.describe BotRequest do
  it "exposes create-kind helpers and a proposed name" do
    request = build(:bot_request, kind: "create", payload: { "name" => "Nimbus" })
    expect(request).to be_create_kind.and be_pending
    expect(request.proposed_name).to eq("Nimbus")
  end

  it "treats a missing payload as empty proposed fields" do
    request = build(:bot_request, kind: "edit", payload: nil)
    expect(request).to be_edit_kind
    expect(request.proposed_username).to eq("")
    expect(request.proposed_bio).to eq("")
    expect(request.proposed_persona_prompt).to eq("")
  end

  it "enforces one pending edit per target bot at the database level" do
    bot = create(:bot)
    create(:bot_request, kind: "edit", target_bot: bot)

    expect do
      create(:bot_request, kind: "edit", target_bot: bot)
    end.to raise_error(ActiveRecord::RecordNotUnique)

    expect do
      create(:bot_request, kind: "edit", target_bot: bot, status: "declined")
    end.not_to raise_error
  end
end
