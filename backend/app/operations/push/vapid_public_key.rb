module Push
  class VapidPublicKey < ApplicationOperation
    Key = Struct.new(:public_key, keyword_init: true)

    def call
      success(Key.new(public_key: Vapid.public_key))
    end
  end
end
