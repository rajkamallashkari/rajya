module Users
  class UpdateProfile < ApplicationOperation
    def call(user:, display_name:, username:, bio: nil, avatar: nil)
      account = user.account
      name = display_name.to_s.strip
      handle = username.to_s.strip
      return name_blank if name.blank?
      return username_invalid unless Auth::Usernames.valid_format?(handle)
      return username_taken if Auth::Usernames.taken?(handle, except_id: account.id)

      account.display_name = name
      account.username = handle
      account.bio = bio.to_s.strip.presence
      account.avatar.attach(avatar) if avatar.present?
      account.save!
      success(Me.new(account: account, user: user))
    end

    private

    def name_blank
      failure(:validation_failed, details: { display_name: [ Catalog.t("errors.models.user.name_blank") ] })
    end

    def username_invalid
      min = Settings.fetch(:username_min_length)
      max = Settings.fetch(:username_max_length)
      failure(:validation_failed, details: {
        username: [ Catalog.t("errors.models.account.username_invalid", min: min, max: max) ]
      })
    end

    def username_taken
      failure(:validation_failed, details: { username: [ Catalog.t("errors.models.account.username_taken") ] })
    end
  end
end
