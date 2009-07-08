# this is the module to handle policy talk with flash sockets
module FlashServer
  
  @policy_sent = false
  
  def self.included(base)
    base.class_eval do
      alias :receive_data_without_policy_handler :receive_data
      alias :receive_data :receive_data_with_policy_handler
    end
  end
  
  def receive_data_with_policy_handler(data)
    log("policy server receiving: #{data}")
    messages = data.split("\0")
    unless @policy_sent
      @policy_sent = true 
      return messages[1] ? receive_data_without_policy_handler(messages[1]) : send_swf_policy
    end
    receive_data_without_policy_handler(data)
  end
  
  # this is a flash security policy thing that needs to be sent on the first request to
  # this server
  def send_swf_policy
    log("sending policy")
    policy = <<-EOS
    <?xml version="1.0" encoding="UTF-8"?> 
    <cross-domain-policy xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.adobe.com/xml/schemas/PolicyFileSocket.xsd">
        <allow-access-from domain="*" to-ports="*" secure="false" />
        <site-control permitted-cross-domain-policies="master-only" />
    </cross-domain-policy>\0
    EOS
    send_data(policy)
  end    

  def log(text)
    puts "#{self.class.to_s}: #{text}"
  end

end
