import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 7);

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface ChatResponse {
  id: string;
  createdAt: Date;
  content: string;
  role: 'assistant';
}

export interface UseChatOptions {
  api?: string;
  socketUrl?: string;
  id?: string;
  initialMessages?: Message[];
  initialInput?: string;
  sendExtraMessageFields?: boolean;
  onResponse?: (response: Response) => Promise<void>;
  onFinish?: (message: ChatResponse) => void;
  onError?: (error: Error) => void;
  headers?: HeadersInit;
  body?: BodyInit;
}
export function useChat({
  socketUrl = 'http://localhost:3000',
  initialMessages = [],
  initialInput = "",
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messagesRef = useRef<Message[]>(initialMessages);
  const [input, setInput] = useState<string>(initialInput);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const append = useCallback((message: Message) => {
    if (!message.id) {
      message.id = nanoid();
    }
    message.createdAt = message.createdAt || new Date();
    setMessages(prevMessages => [...prevMessages, message]);
    messagesRef.current = [...messagesRef.current, message];
  }, []);
  useEffect(() => {
    socketRef.current = io(socketUrl);

    socketRef.current.on('agent_response', (data: string) => {
      setIsLoading(false); // Set loading to false upon receiving a response
      const newMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: data,
        createdAt: new Date(),
      };
      append(newMessage);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [append, socketUrl]);

  const reload = useCallback(() => {
    // Clear the current chat messages
    setMessages([]);
  
    // Or if you want to reconnect the WebSocket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  }, []);
  

  const stop = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const sendAgentRequest = useCallback(() => {
    if (!input || !socketRef.current) return;

    setIsLoading(true); // Set loading to true when sending a request

    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };
    append(userMessage);
    socketRef.current.emit('agent_request', JSON.stringify(messagesRef.current.concat(userMessage).map(({ role, content }) => ({ role, content }))));
    setInput('');
  }, [input, append]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendAgentRequest();
  }, [sendAgentRequest]);

  return {
    messages,
    append,
    reload,
    stop,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    sendAgentRequest,
  };
}
