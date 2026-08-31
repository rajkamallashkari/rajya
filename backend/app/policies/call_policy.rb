class CallPolicy < ApplicationPolicy
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

  private

  def participant?
    record.is_a?(Call) && record.includes_account?(account.id)
  end
end
