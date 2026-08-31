class CallEnvelopeResource < ApplicationResource
  attribute :call do
    object.call && CallResource.new(object.call).to_h
  end

  attribute :ice_servers do
    object.ice_servers
  end
end
