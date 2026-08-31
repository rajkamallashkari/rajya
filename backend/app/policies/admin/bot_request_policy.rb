module Admin
  class BotRequestPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def index?
      user.is_admin?
    end

    def approve?
      user.is_admin?
    end

    def decline?
      user.is_admin?
    end
  end
end
