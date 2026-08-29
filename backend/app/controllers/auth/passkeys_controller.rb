module Auth
  class PasskeysController < BaseController
    def authentication_options
      render_result(Auth::Passkeys::AuthenticationOptions.call(email: params[:email]),
                    serializer: WebauthnOptionsResource)
    end

    def authenticate
      render_result(Auth::Passkeys::Authenticate.call(credential: params[:credential], nonce: params[:nonce]),
                    serializer: SessionResource)
    end
  end
end
