class AdminSettingResource < ApplicationResource
  attribute :setting do
    object.setting
  end
end
