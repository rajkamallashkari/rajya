module Admin
  class TranscriptPolicy
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
