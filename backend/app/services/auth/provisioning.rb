# Creates the human identity triple (account + user + preferences) in one
# transaction. Google and password registration share this so neither path
# can persist a User without an Account (SCHEMA §2).
module Auth
  class Provisioning
    class << self
      def create_human!(email:, display_name:, password: nil, google_subject: nil, email_verified: false)
        ApplicationRecord.transaction do
          account = Account.create!(
            kind: "human",
            username: Usernames.from_email(email),
            display_name: display_name
          )
          user = User.create!(
            account: account,
            email: email,
            password: password,
            google_subject: google_subject,
            email_verified_at: email_verified ? Time.current : nil
          )
          Preference.create!(account: account, data: {})
          user
        end
      end
    end
  end
end
