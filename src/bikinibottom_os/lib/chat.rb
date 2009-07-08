class Chat
  
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
  
  def message_to(user, message)
    @queue << message
  end

  class << self
    def exists?(user_1, user_2)
      !!find(user_1, user_2)
    end

    def find(user_1, user_2)
      @@chats[chat_id(user_1, user_2)]
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
