class User
  
  attr_accessor :user_id
  attr_accessor :socket_id
  
  def initialize(args = {})
    @user_id = args[:user_id]
    @socket_id = args[:socket_id]
  end
end