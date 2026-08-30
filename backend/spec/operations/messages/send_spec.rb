require "rails_helper"

RSpec.describe Messages::Send do
  def setup
    user = create(:user)
    peer = create(:account)
    [ user, create_direct_between(user.account, peer) ]
  end

  def send!(conversation, sender, **attrs)
    described_class.call(conversation: conversation, sender: sender, **attrs)
  end

  it "persists a text message with a position, revision, and sender snapshot" do
    user, conversation = setup
    result = send!(conversation, user.account, body: "Hello")
    message = result.value

    expect(result).to be_success
    expect(message).to have_attributes(position: 1, revision: 1, kind: "text", body: "Hello")
    expect(message.sender_snapshot).to include("id" => user.account.id, "username" => user.account.username)
  end

  it "returns the same row when the same client_nonce is sent twice (F-3)" do
    user, conversation = setup
    nonce = SecureRandom.uuid
    first = send!(conversation, user.account, body: "Once", client_nonce: nonce).value
    second = send!(conversation, user.account, body: "Once", client_nonce: nonce).value

    expect(second.id).to eq(first.id)
    expect(conversation.messages.count).to eq(1)
  end

  it "returns the winner when a concurrent insert claims the nonce (F-3)" do
    user, conversation = setup
    nonce = SecureRandom.uuid
    existing = send!(conversation, user.account, body: "Won", client_nonce: nonce).value
    allow(Message).to receive_messages(
      find_by: nil, find_by!: existing
    )
    allow(Message).to receive(:create!).and_raise(
      ActiveRecord::RecordNotUnique.new("idx_messages_client_nonce_unique")
    )

    expect(send!(conversation, user.account, body: "Won", client_nonce: nonce).value.id).to eq(existing.id)
  end

  it "rejects a blank body without attachments, an overlong body, and a bad nonce" do
    user, conversation = setup
    overlong = "x" * (Settings.fetch(:max_message_length) + 1)

    expect(send!(conversation, user.account, body: "  ").error_code).to eq(:validation_failed)
    expect(send!(conversation, user.account, body: overlong).error_code).to eq(:validation_failed)
    expect(send!(conversation, user.account, body: "Hi", client_nonce: "not-a-uuid").error_code)
      .to eq(:validation_failed)
  end

  it "rejects a missing reply, a cross-conversation reply, and a channel member" do
    user, conversation = setup
    other = create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])
    foreign = create(:message, conversation: other)
    member = create(:user)
    channel = create_talk(kind: "channel", owner: create(:user).account, members: [ member.account ])

    expect(send!(conversation, user.account, body: "Hi", reply_to_message_id: 0).error_code).to eq(:not_found)
    expect(send!(conversation, user.account, body: "Hi", reply_to_message_id: foreign.id).error_code)
      .to eq(:validation_failed)
    expect(send!(channel, member.account, body: "Hi").error_code).to eq(:forbidden)
  end

  it "attaches valid blobs, skips invalid signed ids, and infers kind (BR-16, BR-17)" do
    user, conversation = setup
    signed = blob_signed_id
    result = send!(
      conversation, user.account, body: "pic",
      attachment_signed_ids: [ signed, "totally-invalid" ]
    )
    message = result.value

    expect(message.attachment_count).to eq(1)
    expect(message.kind).to eq("image")
    expect(message.attachments.first.file).to be_attached
  end

  it "allows an attachment-only send and rolls back when every signed id is invalid" do
    user, conversation = setup
    signed = blob_signed_id(filename: "a.mp4", content_type: "video/mp4")

    expect(send!(conversation, user.account, attachment_signed_ids: [ signed ]).value.kind).to eq("video")
    expect(send!(conversation, user.account, attachment_signed_ids: [ "nope" ]).error_code).to eq(:validation_failed)
  end

  it "stores a voice note with a clamped waveform (BR-18)" do
    user, conversation = setup
    signed = blob_signed_id(filename: "v.ogg", content_type: "audio/ogg")
    result = send!(
      conversation, user.account, attachment_signed_ids: [ signed ],
      voice_duration_ms: 1_000, voice_waveform: [ -1, 0.5, 2, "bad" ]
    )

    expect(result.value.kind).to eq("voice")
    expect(result.value.attachments.first.waveform).to eq([ 0.0, 0.5, 1.0, 0.0 ])
  end

  it "rejects an overlong voice recording (BR-19)" do
    user, conversation = setup
    signed = blob_signed_id(filename: "v.ogg", content_type: "audio/ogg")
    over = Settings.fetch(:voice_note_max_seconds).seconds.in_milliseconds + 1

    expect(send!(conversation, user.account, attachment_signed_ids: [ signed ],
                 voice_duration_ms: over).error_code).to eq(:validation_failed)
  end

  it "advances sender watermarks on send and never moves them backwards (BR-27, BR-28)" do
    user, conversation = setup
    membership = conversation.conversation_memberships.find_by!(account: user.account)
    first = send!(conversation, user.account, body: "Hi").value
    membership.update_columns(last_read_position: first.position + 1, last_seen_position: first.position + 1,
                              last_delivered_position: first.position + 1)
    send!(conversation, user.account, body: "Lo")
    membership.reload

    expect(membership.last_read_position).to eq(first.position + 1)
    expect(membership.unread_count).to eq(0)
  end

  it "skips watermark writes when the sender membership has disappeared" do
    user, conversation = setup
    allow(conversation.conversation_memberships).to receive(:active).and_return(ConversationMembership.none)
    expect(send!(conversation, user.account, body: "Hi")).to be_success
  end

  it "re-raises uniqueness errors that are not the client_nonce race" do
    user, conversation = setup
    allow(Message).to receive(:create!).and_raise(ActiveRecord::RecordNotUnique.new("idx_messages_position"))
    expect { send!(conversation, user.account, body: "Hi") }.to raise_error(ActiveRecord::RecordNotUnique)
  end

  it "replies in-thread, infers file kind, and ignores a JSON waveform that is not an array" do
    user, conversation = setup
    parent = send!(conversation, user.account, body: "Root").value
    signed = blob_signed_id(filename: "doc.pdf", content_type: "application/pdf")
    reply = send!(conversation, user.account, body: "Re", reply_to_message_id: parent.id).value
    file = send!(conversation, user.account, attachment_signed_ids: [ signed ], voice_waveform: "{").value

    expect(reply.reply_to_message_id).to eq(parent.id)
    expect(file.kind).to eq("file")
    audio = blob_signed_id(filename: "a.mp3", content_type: "audio/mpeg")
    expect(send!(conversation, user.account, attachment_signed_ids: [ audio ]).value.kind).to eq("audio")
  end

  it "persists silent send and still advances the delivered watermark (NR-23)" do
    user, conversation = setup
    membership = conversation.conversation_memberships.find_by!(account: user.account)
    message = send!(conversation, user.account, body: "Quiet", silent: true).value
    membership.reload

    expect(message.silent).to be(true)
    expect(membership.last_delivered_position).to eq(message.position)
  end
end
