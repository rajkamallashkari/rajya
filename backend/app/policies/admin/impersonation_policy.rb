module Admin
  class ImpersonationPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def create?
      user.is_admin?
    end

    def destroy?
      user.is_admin?
    end
  end
end
