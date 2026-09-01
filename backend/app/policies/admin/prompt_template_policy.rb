module Admin
  class PromptTemplatePolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def index?
      user.is_admin?
    end

    def update?
      user.is_admin?
    end
  end
end
