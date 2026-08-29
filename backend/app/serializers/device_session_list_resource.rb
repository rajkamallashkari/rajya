class DeviceSessionListResource < ApplicationResource
  attribute :sessions do
    object.sessions.map do |session|
      DeviceSessionResource.new(session, params: { current_jti: object.current_jti }).to_h
    end
  end
end
