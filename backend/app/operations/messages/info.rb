module Messages
  class Info < ApplicationOperation
    def call(message:)
      success(Watermarks.call(message: message))
    end
  end
end
