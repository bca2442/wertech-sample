import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Phone, Video, Search, MoreVertical, CheckCircle2 } from 'lucide-react';

export default function BarterChat() {
  const [activeChat, setActiveChat] = useState(1);
  const [replyText, setReplyText] = useState("");

  // Chat data representing requests and replies
  const [chats, setChats] = useState([
    {
      id: 1,
      name: "Sana K.",
      lastMsg: "Is the yoga class still open?",
      time: "2m ago",
      online: true,
      itemRequested: "Yoga Class",
      history: [
        { sender: 'them', text: "Hi! I saw your Yoga listing. Would you like to exchange it for my Python tutoring session?" },
        { sender: 'them', text: "Is the yoga class still open?" }
      ]
    },
    {
      id: 2,
      name: "Rahul K.",
      lastMsg: "Thanks for the drill!",
      time: "1h ago",
      online: false,
      itemRequested: "Hammer Drill",
      history: [
        { sender: 'them', text: "Hey, just finished using the drill. It worked great!" },
        { sender: 'me', text: "Glad to hear that, Rahul! Let me know if you need anything else." },
        { sender: 'them', text: "Thanks for the drill!" }
      ]
    }
  ]);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const updatedChats = chats.map(chat => {
      if (chat.id === activeChat) {
        return {
          ...chat,
          history: [...chat.history, { sender: 'me', text: replyText }],
          lastMsg: replyText
        };
      }
      return chat;
    });

    setChats(updatedChats);
    setReplyText("");
  };

  const currentChat = chats.find(c => c.id === activeChat);

  return (
    <div className="flex h-[calc(100vh-80px)] m-10 bg-white dark:bg-slate-900 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-500">
      
      {/* 1. MESSAGE REQUESTS SIDEBAR */}
      <div className="w-96 border-r border-slate-100 dark:border-slate-800 flex flex-col">
        <div className="p-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6">Messages</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none text-sm font-bold dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
          {chats.map(chat => (
            <button 
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-[32px] transition-all ${
                activeChat === chat.id 
                ? 'bg-teal-50 dark:bg-teal-900/20 ring-1 ring-teal-500/20' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-black text-slate-500 text-xl">
                  {chat.name[0]}
                </div>
                {chat.online && <div className="absolute bottom-0 right-0 w-4 h-4 bg-teal-500 border-4 border-white dark:border-slate-900 rounded-full" />}
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-black text-slate-900 dark:text-white truncate">{chat.name}</p>
                  <span className="text-[10px] font-bold text-slate-400">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-400 font-bold truncate mt-1">{chat.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. CHAT & REPLY AREA */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {/* Chat Header */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-2xl flex items-center justify-center font-bold text-teal-600">
              {currentChat.name[0]}
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white text-lg">{currentChat.name}</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry: {currentChat.itemRequested}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-4 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><Phone size={20}/></button>
            <button className="p-4 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><Video size={20}/></button>
            <button className="p-4 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"><MoreVertical size={20}/></button>
          </div>
        </div>

        {/* Message History */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30 dark:bg-transparent">
          {currentChat.history.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, x: msg.sender === 'me' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={i} 
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[60%] p-6 rounded-[35px] font-bold text-sm leading-relaxed shadow-sm ${
                msg.sender === 'me' 
                  ? 'bg-teal-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 3. REPLY BOX */}
        <form onSubmit={handleSendReply} className="p-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <input 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentChat.name.split(' ')[0]}...`} 
              className="w-full pl-8 pr-24 py-6 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-[30px] outline-none ring-2 ring-transparent focus:ring-teal-500 transition-all font-bold"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-teal-600 text-white px-6 py-4 rounded-[22px] hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest"
            >
              Send <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}