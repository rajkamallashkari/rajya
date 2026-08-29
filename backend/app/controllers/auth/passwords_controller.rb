module Auth
  class PasswordsController < BaseController
    def create
      render_result(Auth::Passwords::Register.call(**password_register_params),
                    serializer: SessionResource, status: :created)
    end

    def login
      render_result(Auth::Passwords::Login.call(email: params[:email], password: params[:password]),
                    serializer: SessionResource)
    end

    def forgot
      render_result(Auth::Passwords::Forgot.call(email: params[:email]),
                    serializer: AuthAcceptedResource)
    end

    def reset
      render_result(Auth::Passwords::Reset.call(**password_reset_params),
                    serializer: SessionResource)
    end

    private

    def password_register_params
      {
        email: params[:email],
        name: params[:name],
        password: params[:password],
        password_confirmation: params[:password_confirmation]
      }
    end

    def password_reset_params
      {
        token: params[:token],
        password: params[:password],
        password_confirmation: params[:password_confirmation]
      }
    end
  end
end
