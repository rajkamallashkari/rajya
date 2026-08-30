class GalleryPageResource < ApplicationResource
  attribute :items do
    object.items.map { |item| serialize_item(item) }
  end

  attribute :meta do
    {
      "page" => object.page,
      "per_page" => object.per_page,
      "total" => object.total,
      "has_more" => object.has_more
    }
  end

  private

  def serialize_item(item)
    if item.is_a?(Attachment)
      {
        "item_kind" => "attachment",
        "attachment" => GalleryAttachmentResource.new(item).to_h,
        "link" => nil
      }
    else
      {
        "item_kind" => "link",
        "attachment" => nil,
        "link" => GalleryLinkResource.new(item).to_h
      }
    end
  end
end
