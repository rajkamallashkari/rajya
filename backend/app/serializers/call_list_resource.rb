class CallListResource < ApplicationResource
  attribute :calls do
    object.calls.map { |entry| CallLogResource.new(entry).to_h }
  end

  attribute :meta do
    {
      "page" => object.page,
      "per_page" => object.per_page,
      "total" => object.total,
      "has_more" => object.has_more
    }
  end
end
