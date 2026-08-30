# SCHEMA §12.8 / NR-34 — registry of overridable group permission keys.
# Each value is the minimum role required. Missing keys impose no extra
# restriction; the §3.1 matrix remains the ceiling (S-17).
module MemberPermissions
  KEYS = %w[
    add_members
    create_invites
    create_polls
    edit_info
    mention_everyone
    pin_messages
    send_media
    send_messages
  ].freeze

  ROLES = %w[member admin owner].freeze

  RANKS = { "member" => 0, "admin" => 1, "owner" => 2 }.freeze

  POLICY_QUERY = {
    "add_members" => :add_members?,
    "create_invites" => :create_invite?,
    "create_polls" => :create_polls?,
    "edit_info" => :update?,
    "mention_everyone" => :mention_everyone?,
    "pin_messages" => :pin?,
    "send_media" => :send_media?,
    "send_messages" => :send_messages?
  }.freeze

  MATRIX_QUERY = {
    "add_members" => :add_members?,
    "create_invites" => :create_invite?,
    "create_polls" => :send?,
    "edit_info" => :update?,
    "mention_everyone" => :send?,
    "pin_messages" => :pin?,
    "send_media" => :send?,
    "send_messages" => :send?
  }.freeze

  class << self
    def valid?(document)
      return false unless document.is_a?(Hash)

      document.all? { |key, value| KEYS.include?(key.to_s) && ROLES.include?(value.to_s) }
    end

    def allows?(role:, document:, key:)
      min = min_role(document, key)
      return true if min == "member"

      rank(role) >= rank(min)
    end

    def min_role(document, key)
      value = document.is_a?(Hash) ? document.stringify_keys[key.to_s] : nil
      ROLES.include?(value.to_s) ? value.to_s : "member"
    end

    def rank(role)
      RANKS.fetch(role.to_s, -1)
    end

    def policy_query(key)
      POLICY_QUERY.fetch(key.to_s)
    end

    def matrix_query(key)
      MATRIX_QUERY.fetch(key.to_s)
    end
  end
end
