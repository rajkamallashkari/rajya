module Admin
  class StickerPackPolicy
    attr_reader :user, :record

    def initialize(user, record)
      @user = user
      @record = record
    end

    def index?
      user.is_admin?
    end

    def create?
      user.is_admin?
    end

    def update?
      user.is_admin?
    end

    def destroy?
      user.is_admin?
    end

    def reorder?
      user.is_admin?
    end

    def add_sticker?
      user.is_admin?
    end
  end
end
