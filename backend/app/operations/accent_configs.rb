module AccentConfigs
  List = Struct.new(:accent_configs, keyword_init: true)

  class Index < ApplicationOperation
    def call(account:, accents:)
      return failure(:forbidden) if account.blank?

      success(List.new(accent_configs: accents.order(:position, :id).to_a))
    end
  end
end
