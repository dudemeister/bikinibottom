class Chat
  
  attr_reader :user_1, :user_2
  
  def initialize(user_1, user_2)
    @user_1 = user_1
    @user_2 = user_2
    @@chats ||= {}
    @@chats[chat_id] = self
    @queue = create_message_queue(chat_id)
  end

  # instance
  def chat_id
    self.class.chat_id(@user_1, @user_2)
  end
  
  def send_message_from(sender, message)
    puts "message from #{sender}: '#{message}'"
    @queue << message
  end

  class << self
    
    def clear_chats!
      @@chats = {}
    end
    
    def exists?(user_1, user_2)
      !!find(user_1, user_2)
    end

    def find(user_1, user_2)
      @@chats ||= {}
      @@chats[chat_id(user_1, user_2)]
    end
    
    def find_or_create(user_1, user_2)
      find(user_1, user_2) || new(user_1, user_2)
    end
    
    # class
    def chat_id(user_1, user_2)
      [user_1, user_2].sort.join('_')
    end
  end
  
  private 
  
    def create_message_queue(id)
      # stub
      []
    end
  
end
