module Auth
  class GoogleController < BaseController
    def create
      render_result(Auth::Google::SignIn.call(code: params[:code]), serializer: SessionResource)
    end
  end
end
