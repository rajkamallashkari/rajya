module Admin
  class DashboardPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def show?
      user.is_admin?
    end
  end
end
