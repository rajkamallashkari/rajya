module Auth
  class OtpController < BaseController
    def create
      render_result(Auth::Otp::Request.call(email: params[:email]), serializer: AuthAcceptedResource)
    end

    def verify
      render_result(Auth::Otp::Verify.call(email: params[:email], code: params[:code]),
                    serializer: SessionResource)
    end
  end
end
