class User
  
  attr_reader :user_id, :socket_id, :queue
  
  def initialize(args = {})
    @user_id = args[:user_id]
    @socket_id = args[:socket_id]
    @queue = create_message_queue
  end
  
  def to_s
    "#{@user_id} (socket_id: #{@socket_id})"
  end
  
  def create_message_queue
    $amq.queue("queue_for_user_#{@user_id.gsub('.', '-')}")
  end

  class << self
  
    def find(user_id)
      @@online_users ||= {}
      @@online_users[user_id]
    end
    
    def add_online(user_id, socket_id)
      @@online_users ||= {}
      @@online_users[user_id] = new(:user_id => user_id, :socket_id => socket_id)
      puts "User #{self} came online. Now #{@@online_users.size} users online."
    end
  end
  
end