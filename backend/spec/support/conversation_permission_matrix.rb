# SCHEMA_DESIGN.md §3.1 — source of truth for the generated policy spec.
# Values: true, false. "—" / "n/a" are false. Channel member react/save/forward
# are read-side yes; reply is a send (no). Leave assumes other members remain
# (owner must transfer; admin may leave when another admin/owner exists).
module ConversationPermissionMatrix
  ACTORS = %i[
    direct
    group_member
    group_admin
    group_owner
    channel_member
    channel_admin
    channel_owner
  ].freeze

  QUERIES = %i[
    send?
    edit_own?
    unsend_own?
    edit_others?
    unsend_others?
    react?
    save?
    reply?
    forward?
    pin?
    start_call?
    update?
    add_members?
    create_invite?
    approve_join?
    remove_member?
    remove_owner?
    promote_admin?
    demote_admin?
    transfer_ownership?
    leave?
  ].freeze

  # rubocop:disable Layout/HashAlignment -- column alignment matches SCHEMA §3.1
  ALLOWED = {
    send?:                { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    edit_own?:            { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    unsend_own?:          { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    edit_others?:         { direct: false, group_member: false, group_admin: false, group_owner: false, channel_member: false, channel_admin: false, channel_owner: false },
    unsend_others?:       { direct: false, group_member: false, group_admin: false, group_owner: false, channel_member: false, channel_admin: false, channel_owner: false },
    react?:               { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: true,  channel_admin: true,  channel_owner: true },
    save?:                { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: true,  channel_admin: true,  channel_owner: true },
    reply?:               { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    forward?:             { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: true,  channel_admin: true,  channel_owner: true },
    pin?:                 { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    start_call?:          { direct: true,  group_member: true,  group_admin: true,  group_owner: true,  channel_member: false, channel_admin: false, channel_owner: false },
    update?:              { direct: false, group_member: false, group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    add_members?:         { direct: false, group_member: false, group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    create_invite?:       { direct: false, group_member: false, group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    approve_join?:        { direct: false, group_member: false, group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    remove_member?:       { direct: false, group_member: false, group_admin: true,  group_owner: true,  channel_member: false, channel_admin: true,  channel_owner: true },
    remove_owner?:        { direct: false, group_member: false, group_admin: false, group_owner: false, channel_member: false, channel_admin: false, channel_owner: false },
    promote_admin?:       { direct: false, group_member: false, group_admin: false, group_owner: true,  channel_member: false, channel_admin: false, channel_owner: true },
    demote_admin?:        { direct: false, group_member: false, group_admin: false, group_owner: true,  channel_member: false, channel_admin: false, channel_owner: true },
    transfer_ownership?:  { direct: false, group_member: false, group_admin: false, group_owner: true,  channel_member: false, channel_admin: false, channel_owner: true },
    leave?:               { direct: false, group_member: true,  group_admin: true,  group_owner: false, channel_member: true,  channel_admin: true,  channel_owner: false }
  }.freeze
  # rubocop:enable Layout/HashAlignment

  HTTP_403 = {
    update?: { method: :patch, body: { title: "Renamed" } }
  }.freeze
end
