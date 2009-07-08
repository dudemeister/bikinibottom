class Chat
  
  def initialize(user_1, user_2)
    @user_1 = user_1
    @user_2 = user_2
    @@chats ||= {}
    @@chats[chat_id] = self
  end
  
  def self.exists?(user_1, user_2)
    !!find(user_1, user_2)
  end
  
  def self.find(user_1, user_2)
    @@chats[self.chat_id(user_1, user_2)]
  end
  
  # instance
  def chat_id
    self.class.chat_id(@user_1, @user_2)
  end
  
  # class
  def self.chat_id(user_1, user_2)
    [user_1, user_2].sort { |a, b| a <=> b}.join('_')
  end
  
end
