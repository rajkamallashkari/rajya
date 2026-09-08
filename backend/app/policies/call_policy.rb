class CallPolicy < ApplicationPolicy
  def index?
    human?
  end

  def show?
    human? && participant?
  end

  def accept? = show?
  def decline? = show?
  def cancel? = show?
  def hangup? = show?
  def screen_share? = show?
  def ice_servers? = human?
  def active? = human?

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless account&.human?

      scope.where(id: CallParticipant.where(account_id: account.id).select(:call_id))
    end
  end

  private

  def participant?
    record.is_a?(Call) && record.includes_account?(account.id)
  end
end
