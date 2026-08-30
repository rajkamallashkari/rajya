module Messages
  class Info < ApplicationOperation
    def call(message:, viewer: nil)
      success(Watermarks.call(message: message, viewer: viewer))
    end
  end
end
