class JoinRequestListResource < ApplicationResource
  attribute :join_requests do
    object.join_requests.map { |row| JoinRequestResource.new(row).to_h }
  end
end
