module Auth
  class BaseController < ApplicationController
    private

    def skip_authentication?
      true
    end

    def skip_authorization?
      true
    end
  end
end
