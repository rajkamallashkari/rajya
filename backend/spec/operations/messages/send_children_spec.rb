require "rails_helper"

RSpec.describe Messages::Send do
  def setup
    user = create(:user)
    [ user, create_direct_between(user.account, create(:account)) ]
  end

  def send!(conversation, sender, **attrs)
    described_class.call(conversation: conversation, sender: sender, **attrs)
  end

  def poll_payload(**attrs)
    { question: "Lunch?", options: [ "Yes", "No" ], **attrs }
  end

  it "creates a poll as a message child without requiring a body (NR-15)" do
    user, conversation = setup
    message = send!(conversation, user.account, poll: poll_payload(allows_multiple: true, is_anonymous: true)).value

    expect(message.poll).to have_attributes(question: "Lunch?", allows_multiple: true, is_anonymous: true)
    expect(message.poll.poll_options.map(&:label)).to eq(%w[Yes No])
  end

  it "creates a static location and contact cards as message children (NR-30, NR-31)" do
    user, conversation = setup
    peer = conversation.conversation_memberships.where.not(account: user.account).sole.account
    message = send!(
      conversation, user.account,
      location: { latitude: "12.97", longitude: "77.59", label: "Cafe" },
      contacts: [ { display_name: "Ada", contact_account_id: peer.id }, { display_name: "Eve", phone: "1" } ]
    ).value

    expect(message.message_location.label).to eq("Cafe")
    expect(message.message_contacts.map(&:display_name)).to eq(%w[Ada Eve])
    expect(message.message_contacts.first.contact_account_id).to eq(peer.id)
  end

  it "rejects a poll with too few options, a location out of range, and a nameless contact" do
    user, conversation = setup
    expect(send!(conversation, user.account, poll: { question: "Q", options: [ "Only" ] }).error_code)
      .to eq(:validation_failed)
    expect(send!(conversation, user.account, location: { latitude: 91, longitude: 0 }).error_code)
      .to eq(:validation_failed)
    expect(send!(conversation, user.account, contacts: [ { display_name: " " } ]).error_code)
      .to eq(:validation_failed)
  end

  it "rolls back when every contact account is missing" do
    user, conversation = setup
    expect(send!(conversation, user.account, contacts: [ { display_name: "Ghost", contact_account_id: 0 } ]).error_code)
      .to eq(:validation_failed)
  end

  it "skips a contact whose account id does not exist" do
    user, conversation = setup
    message = send!(
      conversation, user.account,
      contacts: [ { display_name: "Ada" }, { display_name: "Ghost", contact_account_id: 0 } ]
    ).value
    expect(message.message_contacts.map(&:display_name)).to eq(%w[Ada])
  end
end
