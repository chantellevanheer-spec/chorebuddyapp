import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Send, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { stripHTMLTags } from '@/components/lib/sanitization';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time message updates
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type === 'create') {
        setMessages(prev => [event.data, ...prev]);
      }
    });

    return unsubscribe;
  }, []);

  const fetchData = async () => {
    try {
      const userData = await base44.auth.me();
      setCurrentUser(userData);

      const [messagesData, usersData] = await Promise.all([
        userData.family_id
          ? base44.entities.Message.filter({ family_id: userData.family_id })
              .then(all => [...all].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')))
              .catch(() => [])
          : [],
        userData.family_id
          ? base44.entities.User.filter({ family_id: userData.family_id }).catch(() => [])
          : []
      ]);

      setMessages(messagesData);
      setUsers(usersData.filter(u => u.id !== userData.id));
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const recipient = selectedRecipient === 'all' ? null : users.find(u => u.id === selectedRecipient);
      
      await base44.entities.Message.create({
        sender_user_id: currentUser.id,
        sender_name: currentUser.full_name,
        recipient_user_id: selectedRecipient === 'all' ? null : selectedRecipient,
        recipient_name: recipient ? recipient.full_name : null,
        content: stripHTMLTags(newMessage),
        is_family_wide: selectedRecipient === 'all',
        family_id: currentUser.family_id
      });

      setNewMessage('');
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (msg.is_family_wide) return true;
    return msg.sender_user_id === currentUser?.id || msg.recipient_user_id === currentUser?.id;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-[#C3B1E1]" />
      </div>
    );
  }

  return (
    <div className="pb-32 lg:pb-8 space-y-6">
      {/* Header */}
      <div className="funky-card p-6 md:p-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="funky-button w-16 h-16 md:w-20 md:h-20 bg-[#C3B1E1] flex items-center justify-center">
            <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <div>
            <h1 className="header-font text-3xl md:text-4xl lg:text-5xl text-[#2B59C3]">Family Messages</h1>
            <p className="body-font-light text-gray-600 mt-2">Chat with your family members</p>
          </div>
        </div>
      </div>

      {/* New Message Form */}
      <div className="funky-card p-6 md:p-8">
        <h2 className="header-font text-2xl text-[#2B59C3] mb-4">Send a Message</h2>
        <div className="space-y-4">
          <div>
            <label className="body-font text-sm text-gray-600 mb-2 block">To:</label>
            <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Everyone
                  </span>
                </SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[100px]"
          />
          
          <Button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="funky-button bg-[#FF6B35] text-white w-full md:w-auto"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        <h2 className="header-font text-2xl text-[#2B59C3] px-2">Recent Messages</h2>
        
        {filteredMessages.length === 0 ? (
          <div className="funky-card p-12 text-center border-4 border-dashed border-gray-300">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="body-font text-gray-600">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`funky-card p-4 md:p-6 ${
                message.sender_user_id === currentUser?.id ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="body-font text-[#5E3B85]">{message.sender_name}</span>
                  {message.is_family_wide ? (
                    <span className="ml-2 text-xs bg-[#C3B1E1] text-white px-2 py-1 rounded-full">
                      Everyone
                    </span>
                  ) : message.recipient_name && (
                    <span className="text-gray-500 text-sm ml-2">→ {message.recipient_name}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(message.created_date), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="body-font-light text-gray-700">{message.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}