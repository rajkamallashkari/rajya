module Admin
  class ReportPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def index?
      user.is_admin?
    end

    def show?
      user.is_admin?
    end

    def dismiss?
      user.is_admin?
    end

    def warn?
      user.is_admin?
    end

    def remove_content?
      user.is_admin?
    end

    def deactivate_account?
      user.is_admin?
    end
  end
end
