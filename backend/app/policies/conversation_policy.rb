# SCHEMA_DESIGN.md §3.1 — the F-1 permission matrix. Directs have no roles
# (peers). Bots never hold admin/owner (enforced at create). Channel members
# may read/react/save/forward but not post. Leave is not offered on directs
# (§3.2). Policies always authorize `current_account` (CONVENTIONS.md §2.4).
class ConversationPolicy < ApplicationPolicy
  def index?
    account.present?
  end

  def create?
    human?
  end

  def show?
    active_member?
  end

  def update?
    manage_group? && override_allows?("edit_info")
  end

  def send?
    return false unless active_member?
    return admin_or_owner? if channel?

    true
  end

  def send_messages?
    send? && override_allows?("send_messages")
  end

  def send_media?
    send? && override_allows?("send_media")
  end

  def create_polls?
    send? && override_allows?("create_polls")
  end

  def mention_everyone?
    send? && override_allows?("mention_everyone")
  end

  def edit_own?
    send_messages?
  end

  def unsend_own?
    send?
  end

  def edit_others?
    false
  end

  def unsend_others?
    false
  end

  def react?
    active_member?
  end

  def save?
    active_member?
  end

  def reply?
    send?
  end

  def forward?
    active_member?
  end

  def pin?
    return false unless active_member?
    return false if channel? && !admin_or_owner?

    override_allows?("pin_messages")
  end

  def organize?
    active_member?
  end

  def start_call?
    active_member? && human? && !channel?
  end

  def add_members?
    manage_group? && override_allows?("add_members")
  end

  def create_invite?
    manage_group? && override_allows?("create_invites")
  end

  def approve_join?
    manage_group?
  end

  def remove_member?
    manage_group?
  end

  def remove_owner?
    false
  end

  def promote_admin?
    owner? && !direct?
  end

  def demote_admin?
    promote_admin?
  end

  def transfer_ownership?
    promote_admin?
  end

  # BR-51: last admin cannot leave while other members remain.
  # SCHEMA §3.1: an owner must transfer first; the last remaining member may leave
  # and the conversation is retained (§3.2).
  def leave?
    return false unless active_member?
    return false if direct?
    return true unless admin_or_owner?
    return true unless other_active_members?
    return false if owner?

    other_admins_or_owners?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account

      scope.where(
        id: ConversationMembership.active.where(account_id: account.id).select(:conversation_id)
      )
    end
  end

  private

  def conversation
    record if record.is_a?(Conversation)
  end

  def membership
    return unless account && conversation

    @membership ||= lookup_membership
  end

  def lookup_membership
    if conversation.association(:conversation_memberships).loaded?
      conversation.conversation_memberships.find { |row| row.account_id == account.id }
    else
      conversation.conversation_memberships.find_by(account_id: account.id)
    end
  end

  def active_member?
    membership&.active?
  end

  def admin_or_owner?
    active_member? && membership.admin_or_owner?
  end

  def owner?
    active_member? && membership.owner?
  end

  def direct?
    conversation&.direct?
  end

  def channel?
    conversation&.channel?
  end

  def manage_group?
    admin_or_owner? && !direct?
  end

  # S-17: empty/missing keys add no restriction; a higher min role can only narrow.
  def override_allows?(key)
    return true if conversation.nil? || conversation.direct?

    MemberPermissions.allows?(
      role: membership&.role,
      document: conversation.member_permissions,
      key: key
    )
  end

  def other_active_members?
    conversation.conversation_memberships.active.where.not(account_id: account.id).exists?
  end

  def other_admins_or_owners?
    conversation.conversation_memberships.active.admins_or_owners.where.not(account_id: account.id).exists?
  end
end
