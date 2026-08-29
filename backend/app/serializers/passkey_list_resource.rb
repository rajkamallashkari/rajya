class PasskeyListResource < ApplicationResource
  many :passkeys, resource: PasskeyResource
end
