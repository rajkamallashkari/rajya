class VapidKeyResource < ApplicationResource
  attribute :public_key, &:public_key
end
