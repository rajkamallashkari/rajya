module Api
  module V1
    class PasskeysController < ApplicationController
      def index
        authorize Passkey
        render_result(Auth::Passkeys::Index.call(passkeys: policy_scope(Passkey)),
                      serializer: PasskeyListResource)
      end

      def registration_options
        authorize Passkey, :create?
        skip_policy_scope
        render_result(Auth::Passkeys::RegistrationOptions.call(user: current_user),
                      serializer: WebauthnOptionsResource)
      end

      def register
        authorize Passkey, :create?
        skip_policy_scope
        render_result(
          Auth::Passkeys::Register.call(user: current_user, credential: params[:credential],
                                        nickname: params[:nickname]),
          serializer: PasskeyResource, status: :created
        )
      end

      def update
        passkey = Passkey.find(params[:id])
        authorize passkey
        render_result(Auth::Passkeys::Rename.call(passkey: passkey, nickname: params[:nickname]),
                      serializer: PasskeyResource)
      end

      def destroy
        passkey = Passkey.find(params[:id])
        authorize passkey
        render_result(Auth::RemoveCredential.call(user: current_user, kind: :passkey, passkey: passkey),
                      serializer: OkResource)
      end

      def lock_options
        authorize Passkey, :lock?
        skip_policy_scope
        render_result(Auth::Passkeys::LockOptions.call(user: current_user),
                      serializer: WebauthnOptionsResource)
      end

      def assert_lock
        authorize Passkey, :assert_lock?
        skip_policy_scope
        render_result(Auth::Passkeys::AssertLock.call(user: current_user, credential: params[:credential]),
                      serializer: OkResource)
      end
    end
  end
end
