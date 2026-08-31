class AiPolicy < ApplicationPolicy
  def rewrite?
    human?
  end

  def translate_text?
    human?
  end

  def style_profile?
    human?
  end
end
