require "rails_helper"

RSpec.describe ConversationPolicy do
  def actor_setup(actor)
    owner = create(:user)
    admin = create(:user)
    member = create(:user)
    peer = create(:user)

    case actor
    when :direct
      [ owner, create_direct_between(owner.account, peer.account) ]
    when :group_member
      [ member, create_talk(kind: "group", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :group_admin
      [ admin, create_talk(kind: "group", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :group_owner
      [ owner, create_talk(kind: "group", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :channel_member
      [ member, create_talk(kind: "channel", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :channel_admin
      [ admin, create_talk(kind: "channel", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    when :channel_owner
      [ owner, create_talk(kind: "channel", owner: owner.account, admins: [ admin.account ], members: [ member.account ]) ]
    end
  end

  ConversationPermissionMatrix::ACTORS.each do |actor|
    ConversationPermissionMatrix::QUERIES.each do |query|
      it "#{actor} #{ConversationPermissionMatrix::ALLOWED.fetch(query).fetch(actor) ? 'may' : 'may not'} #{query}" do
        user, conversation = actor_setup(actor)
        expect(described_class.new(user.account, conversation).public_send(query))
          .to eq(ConversationPermissionMatrix::ALLOWED.fetch(query).fetch(actor))
      end
    end
  end

  it "denies index and show when there is no acting account" do
    conversation = create(:conversation)
    policy = described_class.new(nil, conversation)

    expect(policy).not_to be_index
    expect(policy).not_to be_show
  end

  it "allows index and create for a human and denies create for a bot" do
    human = create(:user).account
    bot = create(:bot).account
    expect(described_class.new(human, Conversation)).to be_index
    expect(described_class.new(human, Conversation)).to be_create
    expect(described_class.new(bot, Conversation)).not_to be_create
  end

  it "denies every instance action to a stranger, a left member, and the class record" do
    owner = create(:user)
    stranger = create(:user)
    conversation = create_talk(kind: "group", owner: owner.account, members: [ create(:account) ])
    create(:conversation_membership, :left, conversation: conversation, account: stranger.account)

    policies = [
      described_class.new(create(:user).account, conversation),
      described_class.new(stranger.account, conversation),
      described_class.new(owner.account, Conversation)
    ]
    expect(policies).to all(satisfy { |policy| !policy.show? && !policy.send? && !policy.leave? })
  end

  it "lets a sole owner leave and blocks a sole admin while members remain" do
    sole = create(:user)
    empty = create_talk(kind: "group", owner: sole.account)
    expect(described_class.new(sole.account, empty).leave?).to be(true)

    admin = create(:user)
    member = create(:account)
    crowded = create_talk(kind: "group", owner: admin.account, members: [ member ])
    crowded.conversation_memberships.find_by!(account: admin.account).update!(role: "admin")
    expect(described_class.new(admin.account, crowded).leave?).to be(false)
  end

  it "denies start_call to a bot in a direct conversation" do
    human = create(:user)
    bot = create(:bot)
    conversation = create_direct_between(human.account, bot.account)
    expect(described_class.new(bot.account, conversation).start_call?).to be(false)
    expect(described_class.new(human.account, conversation).start_call?).to be(true)
  end

  it "lets a channel member pin the conversation in their sidebar (NR-21)" do
    member = create(:user)
    conversation = create_talk(kind: "channel", owner: create(:user).account, members: [ member.account ])
    expect(described_class.new(member.account, conversation).organize?).to be(true)
    expect(described_class.new(member.account, conversation).pin?).to be(false)
  end

  it "treats a class-level record as having no conversation kind" do
    policy = described_class.new(create(:user).account, Conversation)

    expect(policy.pin?).to be(false)
    expect(policy.send(:direct?)).to be_falsey
    expect(policy.send(:channel?)).to be_falsey
    expect(policy.send(:override_allows?, "send_messages")).to be(true)
  end

  it "evaluates overrides for a stranger against a group" do
    stranger = create(:user)
    conversation = create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])

    expect(described_class.new(stranger.account, conversation).send(:override_allows?, "send_messages"))
      .to be(true)
  end

  MemberPermissions::KEYS.each do |key|
    ConversationPermissionMatrix::ACTORS.each do |actor|
      it "does not grant #{actor} #{key} when override is member (S-17)" do
        user, conversation = actor_setup(actor)
        conversation.update!(member_permissions: { key => "member" })
        matrix = ConversationPermissionMatrix::ALLOWED.fetch(MemberPermissions.matrix_query(key)).fetch(actor)
        expect(described_class.new(user.account, conversation).public_send(MemberPermissions.policy_query(key)))
          .to eq(matrix)
      end
    end
  end

  it "narrows send_messages so a group member cannot post text (NR-34)" do
    member = create(:user)
    conversation = create_talk(kind: "group", owner: create(:user).account, members: [ member.account ])
    conversation.update!(member_permissions: { "send_messages" => "admin" })
    policy = described_class.new(member.account, conversation)

    expect(policy).to be_send
    expect(policy).not_to be_send_messages
  end

  it "narrows edit_info without taking add_members away from an admin (NR-34)" do
    admin = create(:user)
    conversation = create_talk(
      kind: "group", owner: create(:user).account, admins: [ admin.account ], members: [ create(:account) ]
    )
    conversation.update!(member_permissions: { "edit_info" => "owner" })
    policy = described_class.new(admin.account, conversation)

    expect(policy).not_to be_update
    expect(policy).to be_add_members
  end

  it "reads a preloaded membership without querying" do
    user = create(:user)
    conversation = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    conversation.conversation_memberships.load
    expect(described_class.new(user.account, conversation).update?).to be(true)
  end

  it "scopes to the account's active memberships including archived" do
    user = create(:user)
    visible = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    archived = create_talk(kind: "group", owner: user.account, members: [ create(:account) ])
    archived.conversation_memberships.find_by!(account: user.account).update!(archived_at: Time.current)
    left = create_talk(kind: "group", owner: create(:user).account, members: [ user.account ])
    left.conversation_memberships.find_by!(account: user.account).update!(status: "left")
    create_talk(kind: "group", owner: create(:user).account, members: [ create(:account) ])

    expect(described_class::Scope.new(user.account, Conversation.all).resolve)
      .to contain_exactly(visible, archived)
    expect(described_class::Scope.new(nil, Conversation.all).resolve).to be_empty
  end
end
