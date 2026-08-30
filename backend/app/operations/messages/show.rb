module Messages
  class Show < ApplicationOperation
    def call(message:)
      success(message)
    end
  end
end
