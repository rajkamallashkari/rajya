module FontConfigs
  List = Struct.new(:font_configs, keyword_init: true)

  class Index < ApplicationOperation
    def call(account:, fonts:)
      return failure(:forbidden) if account.blank?

      success(List.new(font_configs: fonts.order(:position, :id).to_a))
    end
  end
end
