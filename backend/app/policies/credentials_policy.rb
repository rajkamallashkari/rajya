class CredentialsPolicy < ApplicationPolicy
  def update_password?
    own_user?
  end

  def verify_password?
    own_user?
  end

  def destroy_email?
    own_user?
  end

  def destroy_password?
    own_user?
  end

  def destroy_google?
    own_user?
  end

  private

  def own_user?
    record.is_a?(User) && record.account_id == account.id
  end
end
