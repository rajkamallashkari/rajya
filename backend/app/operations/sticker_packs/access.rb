module StickerPacks
  class Access
    def self.allowed?(pack, actor)
      return false if actor.blank?
      return true if pack.owner_account_id == actor.id
      return false unless pack.system?

      actor.user&.is_admin?
    end
  end
end
