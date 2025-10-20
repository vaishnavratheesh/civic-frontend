import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Spinner from './Spinner';

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    message: string;
    timestamp: Date;
    wardInfo?: {
        population: number;
        activeIssues: number;
        availableSchemes: number;
    };
}

interface GovernmentChatbotProps {
    isOpen: boolean;
    onClose: () => void;
}

const GovernmentChatbot: React.FC<GovernmentChatbotProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chatbot opens
    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    // Initialize with welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const welcomeMessage: ChatMessage = {
                id: 'welcome',
                type: 'bot',
                message: `Hello ${user?.name || 'Citizen'}! 👋\n\nI'm your Government AI Assistant for Ward ${user?.ward || 'N/A'}, Erumeli Panchayath. I can help you with:\n\n🏛️ Ward information and statistics\n📝 Welfare schemes and applications\n📢 Grievance submission and tracking\n👥 Councillor contact details\n🗳️ E-Sabha meetings\n📅 Announcements and events\n❓ System navigation help\n\nWhat would you like to know about today?`,
                timestamp: new Date()
            };
            setMessages([welcomeMessage]);
        }
    }, [isOpen, user, messages.length]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading || !user?.ward) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            message: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ai/chatbot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: userMessage.message,
                    ward: user.ward
                })
            });

            if (response.ok) {
                const data = await response.json();
                const botMessage: ChatMessage = {
                    id: `bot-${Date.now()}`,
                    type: 'bot',
                    message: data.response || 'Sorry, I could not process your request.',
                    timestamp: new Date(),
                    wardInfo: data.wardInfo
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            
            // Provide helpful fallback responses
            const lowerMessage = userMessage.message.toLowerCase();
            let fallbackResponse = '';

            if (lowerMessage.includes('welfare') || lowerMessage.includes('scheme')) {
                fallbackResponse = `For welfare schemes in Ward ${user.ward}:\n\n• Check the "Welfare Schemes" tab in your dashboard\n• Look for active schemes with available slots\n• Click "Apply Now" to submit applications\n• Contact your ward councillor for eligibility questions\n\nNote: I'm currently updating my knowledge base. For the most current information, please check the Welfare Schemes section.`;
            } else if (lowerMessage.includes('grievance') || lowerMessage.includes('complaint')) {
                fallbackResponse = `To submit a grievance in Ward ${user.ward}:\n\n1. Go to "My Grievances" tab\n2. Click "Submit New Grievance"\n3. Fill in the details and add photos\n4. Mark the location on the map\n5. Submit for review\n\nYou can track the status in the same section. For urgent issues, contact your councillor directly.`;
            } else if (lowerMessage.includes('councillor') || lowerMessage.includes('contact')) {
                fallbackResponse = `To contact your Ward ${user.ward} councillor:\n\n• Check the "My Ward" section for councillor details\n• Look for contact information and office hours\n• You can also submit grievances through the system\n• For emergencies, call the panchayath office\n\nNote: Councillor information is displayed in your ward information section.`;
            } else if (lowerMessage.includes('application') || lowerMessage.includes('status')) {
                fallbackResponse = `To check your application status:\n\n• Go to "Welfare Schemes" tab\n• Scroll down to "My Applications" section\n• View status: Active, Accepted, or Rejected\n• Click "Print PDF" to download application copies\n\nApplications are reviewed by your ward councillor and scored automatically.`;
            } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
                fallbackResponse = `I can help you with:\n\n🏛️ **Ward Information**: Population, statistics, councillor details\n📝 **Welfare Schemes**: Available programs, applications, eligibility\n📢 **Grievances**: Submit complaints, track status, upload evidence\n🗳️ **E-Sabha**: Join virtual meetings when active\n📅 **Events**: Check announcements and upcoming events\n\nWhat specific area would you like help with?`;
            } else {
                fallbackResponse = `Hello! I'm your Government AI Assistant for Ward ${user.ward}. I'm currently updating my systems, but I can still help you with:\n\n• **Welfare Schemes**: Check the "Welfare Schemes" tab\n• **Grievances**: Use "My Grievances" to report issues\n• **Ward Info**: Find councillor details in "My Ward"\n• **Applications**: Track status in "Welfare Schemes"\n\nFor immediate assistance, contact your ward councillor or visit the panchayath office. What would you like help with?`;
            }

            const botMessage: ChatMessage = {
                id: `bot-${Date.now()}`,
                type: 'bot',
                message: fallbackResponse,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        // Re-add welcome message
        const welcomeMessage: ChatMessage = {
            id: 'welcome-new',
            type: 'bot',
            message: `Chat cleared! How can I help you with Ward ${user?.ward} services today?`,
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    };

    const quickQuestions = [
        "What welfare schemes are available?",
        "How do I submit a grievance?",
        "Who is my ward councillor?",
        "What's the population of my ward?",
        "How do I join E-Sabha meetings?",
        "Check my application status"
    ];

    const handleQuickQuestion = (question: string) => {
        setInputMessage(question);
        setTimeout(() => sendMessage(), 100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
                isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
            }`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <i className="fas fa-robot text-sm"></i>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Government AI Assistant</h3>
                            <p className="text-xs text-blue-100">Ward {user?.ward} • Erumeli Panchayath</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                            title={isMinimized ? 'Expand' : 'Minimize'}
                        >
                            <i className={`fas ${isMinimized ? 'fa-expand' : 'fa-minus'} text-sm`}></i>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                            title="Close"
                        >
                            <i className="fas fa-times text-sm"></i>
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-96">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        msg.type === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        <div className="whitespace-pre-wrap text-sm">{msg.message}</div>
                                        {msg.wardInfo && (
                                            <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center">
                                                        <div className="font-semibold">{msg.wardInfo.population}</div>
                                                        <div className="text-gray-600">Citizens</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-semibold">{msg.wardInfo.activeIssues}</div>
                                                        <div className="text-gray-600">Active Issues</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-semibold">{msg.wardInfo.availableSchemes}</div>
                                                        <div className="text-gray-600">Schemes</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="text-xs opacity-70 mt-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Spinner size="sm" />
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Questions */}
                        {messages.length <= 1 && (
                            <div className="px-4 pb-2">
                                <div className="text-xs text-gray-600 mb-2">Quick questions:</div>
                                <div className="flex flex-wrap gap-1">
                                    {quickQuestions.slice(0, 3).map((question, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleQuickQuestion(question)}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="border-t border-gray-200 p-4">
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask about ward services, schemes, or grievances..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    onClick={sendMessage}
                                    disabled={isLoading || !inputMessage.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                                >
                                    <i className="fas fa-paper-plane text-sm"></i>
                                </button>
                                <button
                                    onClick={clearChat}
                                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg transition-colors"
                                    title="Clear chat"
                                >
                                    <i className="fas fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GovernmentChatbot;