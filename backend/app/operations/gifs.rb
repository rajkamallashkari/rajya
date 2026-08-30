module Gifs
  List = Struct.new(:gifs, keyword_init: true)
  Hit = Struct.new(:id, :title, :preview_url, keyword_init: true)
end
