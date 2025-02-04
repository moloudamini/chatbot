import React, { createContext, useState, useEffect, ReactNode } from "react";

//Message interface
interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

//Response interface
interface ChatResponse {
  response: string;
}

//ChatBotContextProps interface
interface ChatBotContextProps {
  messages: Message[];
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: () => void;
  chatOpen: boolean;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showEmojiPicker: boolean;
  setShowEmojiPicker: React.Dispatch<React.SetStateAction<boolean>>;
  addEmojiToInput: (emoji: { native: string }) => void;
  exportConversation: () => void;
  formatTimestamp: (timestamp: Date) => string;
}

//Initial message from bot
const initialMessages: Message[] = [
  {
    sender: "bot",
    text: "Hello! How can I assist you today?",
    timestamp: new Date(),
  },
];

//ChatBotContext
export const ChatBotContext = createContext<ChatBotContextProps | undefined>(
  undefined
);

//ChatBotProviderProps Interface
interface ChatBotProviderProps {
  children: ReactNode;
}

//ChatBotProvider component to provide chat context to children
export const ChatBotProvider: React.FC<ChatBotProviderProps> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  //Toggle dark mode
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  //Send message
  const sendMessage = async () => {
    if (!inputText.trim()) return;
    //User message object
    const userMessage: Message = {
      sender: "user",
      text: inputText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    //Prepare data to send to the API
    try {
      const formData = new FormData();
      formData.append("message", inputText);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/chat`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok)
        throw new Error(`Network response was not ok: ${response.status}`);

      const data: ChatResponse = await response.json();
      const botReply: Message = {
        sender: "bot",
        text: data.response,
        timestamp: new Date(),
      };

      //Simulate typing delay before adding the bot's reply to messages (real thinking for bot)
      const typingDelay = Math.max(1000, botReply.text.length * 50);
      setTimeout(() => {
        setMessages((prev) => [...prev, botReply]);
        setIsLoading(false);
      }, typingDelay);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, something went wrong.",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".menu-container")) setMenuOpen(false);
    };

    if (menuOpen) {
      document.addEventListener("click", handleClickOutside);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpen]);

  //Format timestamps for display
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const isToday =
      timestamp.getDate() === now.getDate() &&
      timestamp.getMonth() === now.getMonth() &&
      timestamp.getFullYear() === now.getFullYear();

    const options: Intl.DateTimeFormatOptions = isToday
      ? { hour: "2-digit", minute: "2-digit", hour12: true }
      : {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        };

    return timestamp.toLocaleString([], options);
  };

  //Add an emoji
  const addEmojiToInput = (emoji: { native: string }) => {
    setInputText((prevInput) => prevInput + emoji.native);
    setShowEmojiPicker(false);
  };

  //Export chat converastion as a text file
  const exportConversation = () => {
    const formatDateForFilename = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    //Format message
    const messageText = messages
      .map(
        (msg) =>
          `${formatTimestamp(msg.timestamp)} - ${msg.sender.toUpperCase()}: ${
            msg.text
          }`
      )
      .join("\n");

    //Create a Blob from the message text
    const blob = new Blob([messageText], { type: "text/plain" });
    const filenameDate = formatDateForFilename(new Date());
    const filename = `chat-history-${filenameDate}-${Date.now()}.txt`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  //Provide the context values to children
  return (
    <ChatBotContext.Provider
      value={{
        messages,
        inputText,
        setInputText,
        sendMessage,
        chatOpen,
        setChatOpen,
        isLoading,
        darkMode,
        setDarkMode,
        menuOpen,
        setMenuOpen,
        showEmojiPicker,
        setShowEmojiPicker,
        addEmojiToInput,
        exportConversation,
        formatTimestamp,
      }}
    >
      {children}
    </ChatBotContext.Provider>
  );
};
