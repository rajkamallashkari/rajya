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
end
