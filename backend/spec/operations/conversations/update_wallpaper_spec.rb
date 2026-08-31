require "rails_helper"

RSpec.describe Conversations::UpdateWallpaper do
  def setup
    user = create(:user)
    peer = create(:account)
    conversation = create_direct_between(user.account, peer)
    [ user, peer, conversation ]
  end

  it "stores wallpaper on the membership so the peer cannot see it (NR-42)" do
    user, peer, conversation = setup
    described_class.call(
      account: user.account, conversation: conversation,
      wallpaper: { "preset" => "dusk", "dim" => 0.2, "blur" => 0.1 }
    )
    alice = Conversations::View.for(conversation.reload, user.account)
    bob = Conversations::View.for(conversation, peer)

    expect(alice.membership.wallpaper).to include("preset" => "dusk", "dim" => 0.2, "blur" => 0.1)
    expect(bob.membership.wallpaper).to be_nil
  end

  it "fills wallpaper defaults and clears an override" do
    user, _peer, conversation = setup
    described_class.call(account: user.account, conversation: conversation, wallpaper: { "preset" => "mist" })
    expect(Conversations::View.for(conversation.reload, user.account).membership.wallpaper)
      .to include("preset" => "mist", "dim" => 0.0, "blur" => 0.0)

    described_class.call(account: user.account, conversation: conversation, wallpaper: nil)
    expect(Conversations::View.for(conversation.reload, user.account).membership.wallpaper).to be_nil
  end

  it "accepts controller parameters" do
    user, _peer, conversation = setup
    described_class.call(
      account: user.account, conversation: conversation,
      wallpaper: ActionController::Parameters.new({ "preset" => "mist" })
    )
    expect(Conversations::View.for(conversation.reload, user.account).membership.wallpaper)
      .to include("preset" => "mist")
  end

  it "rejects an unknown preset and a non-object wallpaper" do
    user, _peer, conversation = setup
    bad_preset = described_class.call(
      account: user.account, conversation: conversation, wallpaper: { "preset" => "neon" }
    )
    expect(bad_preset.error_code).to eq(:validation_failed)
    expect(bad_preset.error_details).to have_key("appearance.wallpaper.preset")

    bad_shape = described_class.call(account: user.account, conversation: conversation, wallpaper: "dusk")
    expect(bad_shape.error_code).to eq(:validation_failed)
  end

  it "treats an empty string as clearing the override" do
    user, _peer, conversation = setup
    described_class.call(
      account: user.account, conversation: conversation, wallpaper: { "preset" => "grove" }
    )
    described_class.call(account: user.account, conversation: conversation, wallpaper: "")
    expect(Conversations::View.for(conversation.reload, user.account).membership.wallpaper).to be_nil
  end

  it "forbids a stranger" do
    _user, _peer, conversation = setup
    expect(described_class.call(account: create(:user).account, conversation: conversation, wallpaper: nil).error_code)
      .to eq(:forbidden)
  end

  it "returns not_found when organize is allowed but membership is missing" do
    _user, _peer, conversation = setup
    stranger = create(:user).account
    allow(ConversationPolicy).to receive(:new).and_return(instance_double(ConversationPolicy, organize?: true))
    expect(described_class.call(account: stranger, conversation: conversation, wallpaper: nil).error_code)
      .to eq(:not_found)
  end
end
