# Pundit, enforced (TARGET_ARCHITECTURE.md §4.4, CONVENTIONS.md §2.5). Policies
# always authorize `account` — the participant acting in conversations — never
# `user`, the human who authenticated. See CONVENTIONS.md §2.4 for why the two
# differ under impersonation.
class ApplicationPolicy
  attr_reader :account, :record

  def initialize(account, record)
    @account = account
    @record = record
  end

  def index? = false
  def show? = false
  def create? = false
  def new? = create?
  def update? = false
  def edit? = update?
  def destroy? = false

  def human?
    account&.human? && account.user.present?
  end

  class Scope
    attr_reader :account, :scope

    def initialize(account, scope)
      @account = account
      @scope = scope
    end

    def resolve
      raise NoMethodError, "You must define #resolve in #{self.class}"
    end
  end
end
