import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Image, Loader2, Send, Sparkles, Trash2, X } from "lucide-react";
import { useAiChatStore, AI_MODELS } from "../store/useAiChatStore"; // Import AI_MODELS
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils.js";
import toast from "react-hot-toast";

// AI Chat Header
const AiChatHeader = ({ onClearChat }) => {
    // 1. Get model state from the store
    const { selectedModel, setSelectedModel } = useAiChatStore();

    return (
        <div className="p-2.5 border-b border-base-300">
            <div className="flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="btn btn-ghost btn-circle btn-sm">
                        <ArrowLeft />
                    </Link>
                    <div className="avatar">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Sparkles className="size-5 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium">AI Chat</h3>
                        {/* 2. Add Model Selector Dropdown */}
                        <select 
                            className="select select-ghost select-xs -ml-2"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                        >
                            {Object.entries(AI_MODELS).map(([key, name]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* Right Side */}
                <button className="btn btn-ghost btn-sm" onClick={onClearChat}>
                    <Trash2 className="size-4" />
                    Clear
                </button>
            </div>
        </div>
    );
};

// AI Message Input 
const AiMessageInput = () => {
    // This component doesn't need any changes, as `sendMessageToAI`
    // automatically uses the selected model from the store.
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const { sendMessageToAI, isLoading } = useAiChatStore();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview) return;

        await sendMessageToAI({
            text: text.trim(),
            image: imagePreview,
        });

        setText("");
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="p-4 w-full">
            {imagePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-zinc-700" />
                        <button onClick={removeImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center" type="button">
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <input type="text" className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        placeholder="Type a message or upload an image..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={isLoading}
                    />
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
                    <button type="button" className={`hidden sm:flex btn btn-circle ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                    >
                        <Image size={24} />
                    </button>
                </div>
                <button type="submit" className="btn btn-md btn-circle flex items-center justify-center bg-primary"
                    disabled={isLoading || (!text.trim() && !imagePreview)}
                >
                    {isLoading ? <Loader2 className="size-6 animate-spin" /> : <Send size={24} />}
                </button>
            </form>
        </div>
    );
};


// Main Page Component
const AiChatPage = () => {
    // 3. Get messages and selectedModel from the store
    const { messages, selectedModel, isLoading, clearChat } = useAiChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    // 4. Get the correct message array for the selected model
    const currentMessages = messages[selectedModel] || [];

    useEffect(() => {
        // 5. Scroll to bottom when currentMessages array changes
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentMessages]); // Dependency changed to currentMessages

    const getAvatar = (role) => {
        // ... (This function is unchanged)
        if (role === 'user') {
            const initial = authUser.fullName ? authUser.fullName[0].toUpperCase() : "?";
            return (
                <div className="avatar">
                    <div className="size-10 rounded-full border-2 border-slate-500/20 overflow-hidden">
                        {authUser.profilePic ? (
                            <img src={authUser.profilePic} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-base-300 flex items-center justify-center">
                                <span className="text-xl font-medium select-none">{initial}</span>
                            </div>
                        )}
                    </div>
                </div>
            );
        } else {
            return (
                <div className="avatar">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Sparkles className="size-5 text-primary" />
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="h-screen bg-base-200">
            <div className="flex items-center justify-center pt-20 px-4">
                <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-4xl h-[calc(100vh-8rem)]">
                    <div className="flex flex-col h-full rounded-lg overflow-hidden">
                        {/* clearChat now gets the model from the store */}
                        <AiChatHeader onClearChat={clearChat} />
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* 6. Map over the correct message array */}
                            {currentMessages.map((message, index) => {
                                const isUser = message.role === 'user';
                                return (
                                    <div
                                        key={index}
                                        className={`chat ${isUser ? "chat-end" : "chat-start"}`}
                                        ref={index === currentMessages.length - 1 ? messageEndRef : null}
                                    >
                                        <div className="chat-image avatar">
                                            {getAvatar(message.role)}
                                        </div>
                                        <div className={`chat-bubble ${isUser ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"} flex flex-col`}>
                                            {message.image && (
                                                <img src={message.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2" />
                                            )}
                                            {message.text && <p>{message.text}</p>}
                                            <time className="text-[10px] opacity-50 mt-1">
                                                {formatMessageTime(new Date())}
                                            </time>
                                        </div>
                                    </div>
                                );
                            })}
                            {isLoading && (
                                <div className="chat chat-start">
                                    <div className="chat-image avatar">
                                        {getAvatar('model')}
                                    </div>
                                    <div className="chat-bubble bg-base-200 text-base-content">
                                        <span className="loading loading-dots loading-md"></span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <AiMessageInput />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiChatPage;