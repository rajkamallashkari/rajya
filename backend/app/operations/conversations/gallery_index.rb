module Conversations
  class GalleryIndex < ApplicationOperation
    def call(conversation:, kind:, page: 1)
      return failure(:validation_failed) unless Gallery.known_kind?(kind)

      success(Gallery.call(conversation: conversation, kind: kind, page: page))
    end
  end
end
