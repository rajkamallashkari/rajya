module Auth
  class MagicLinksController < BaseController
    def create
      render_result(Auth::MagicLinks::Request.call(email: params[:email]),
                    serializer: AuthAcceptedResource)
    end

    def verify
      render_result(Auth::MagicLinks::Verify.call(token: params[:token]), serializer: SessionResource)
    end
  end
end
