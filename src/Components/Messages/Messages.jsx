import React, { useState, useEffect, useCallback } from "react";
import { Autocomplete, TextField, List, ListItem, ListItemText, Divider, Paper, Typography, Input, Button } from "@mui/material";
import { getConversations, getMessages, sendMessage, findConversation, createConversation, getProfileById, getOtherUserFromConversation, getProfileForUser, getUsernameFromProfile } from "../../Services/messaging";
import "./Messages.css";

// Component for conversation list item
const ConversationListItem = ({ conv, onClick, username }) => {
    return (
        <ListItem button onClick={onClick}>
            <ListItemText primary={username || "Loading..."} />
        </ListItem>
    );
};

// Component for message history
const MessageHistory = ({ messages, currentUser, getProfileForUser }) => {
    const [messageStates, setMessageStates] = useState({});

    useEffect(() => {
        const loadMessageStates = async () => {
            const states = {};
            const currentUserProfile = await getProfileForUser(currentUser);
            
            for (const msg of messages) {
                const senderProfile = msg.get("sender");
                const isSent = senderProfile && currentUserProfile && senderProfile.id === currentUserProfile.id;
                states[msg.id] = isSent;
            }
            setMessageStates(states);
        };
        
        if (messages.length > 0 && currentUser) {
            loadMessageStates();
        }
    }, [messages, currentUser, getProfileForUser]);

    return (
        <div className="message-history">
            {messages.map(msg => {
                const isSent = messageStates[msg.id] || false;
                return (
                    <div key={msg.id} className={`message ${isSent ? "sent" : "received"}`}>
                        <Typography variant="body2">{msg.get("content")}</Typography>
                    </div>
                );
            })}
        </div>
    );
};

const Messages = ({ users, currentUser }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [otherUserProfile, setOtherUserProfile] = useState(null);
    const [conversationUsernames, setConversationUsernames] = useState({});

    const loadConversations = useCallback(async () => {
        const convs = await getConversations(currentUser);
        console.log("Loaded conversations:", convs);
        setConversations(convs);
        
        // Load usernames for each conversation
        const usernames = {};
        for (const conv of convs) {
            try {
                const otherProfile = await getOtherUserFromConversation(conv, currentUser);
                console.log("Other profile for conversation", conv.id, ":", otherProfile);
                if (otherProfile) {
                    const username = await getUsernameFromProfile(otherProfile);
                    if (username) {
                        usernames[conv.id] = username;
                    }
                }
            } catch (error) {
                console.error("Error loading username for conversation:", error);
            }
        }
        setConversationUsernames(usernames);
    }, [currentUser]);

    const handleSelectUser = async (event, newValue) => {
        if (newValue && currentUser) {
            // newValue is a plain Profile JSON object from getAllUsers
            // We need to get the actual Profile Parse object
            const profileId = newValue.objectId || newValue.id;
            if (!profileId) {
                console.error("Could not find profile ID in selected profile:", newValue);
                return;
            }
            
            // Fetch the actual Profile Parse object
            const user2Profile = await getProfileById(profileId);
            if (!user2Profile) {
                console.error("Could not fetch profile with ID:", profileId);
                return;
            }
            
            // Get current user's profile
            const currentUserProfile = await getProfileForUser(currentUser);
            console.log(currentUserProfile, user2Profile);
            
            if (!currentUserProfile || !user2Profile) {
                console.error("Could not find profiles for users");
                return;
            }
            
            let conv = await findConversation(currentUserProfile, user2Profile);
            if (!conv) {
                conv = await createConversation(currentUserProfile, user2Profile);
                if (conv) {
                    await loadConversations(); // Reload conversations
                }
            }
            
            if (conv) {
                setSelectedConversation(conv);
                setOtherUserProfile(user2Profile);
                setMessages([]);
            }
        }
    };

    const handleSelectConversation = async (conv) => {
        setSelectedConversation(conv);
        if (currentUser) {
            const otherProfile = await getOtherUserFromConversation(conv, currentUser);
            setOtherUserProfile(otherProfile);
        }
    };

    useEffect(() => {
        if (selectedConversation) {
            getMessages(selectedConversation).then(msgs => {
                setMessages(msgs);
            });
        }
    }, [selectedConversation]);

    const handleSendMessage = async () => {
        if (newMessage.trim() === "" || !selectedConversation || !otherUserProfile) return;

        // Get current user's profile
        const currentUserProfile = await getProfileForUser(currentUser);
        
        if (!currentUserProfile) {
            console.error("Could not find current user's profile");
            return;
        }

        const message = await sendMessage(currentUserProfile, otherUserProfile, newMessage.trim());
        if (message) {
            setMessages([...messages, message]);
            setNewMessage("");
            // Reload conversations to update last message
            await loadConversations();
        }
    };
    

    if (!currentUser) {
        return <div>Loading...</div>;
    }

    return (
        <div className="messages-container">
            <div className="conversations-list">
                <Autocomplete
                    options={users.filter(u => {
                        const profileUserId = u.user?.objectId || u.userId?.objectId || u.userId || u.id;
                        return profileUserId !== currentUser?.id;
                    })}
                    getOptionLabel={(option) => {
                        if (option.user?.username) return option.user.username;
                        if (option.userId?.username) return option.userId.username;
                        if (option.username) return option.username;
                        return option.id || "Unknown User";
                    }}
                    sx={{
                        width: "90%",
                        margin: "20px auto",
                        "& .MuiInputRoot": {
                            borderRadius: "20px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            "& fieldset": {
                                border: "none",
                            },
                        },
                    }}
                    onChange={handleSelectUser}
                    renderInput={(params) => <TextField {...params} label="Search for a user" variant="outlined" />}
                    PaperComponent={(props) => (
                        <Paper 
                            elevation={3}
                            {...props}
                            sx={{
                                borderRadius: "10px",
                                marginTop: "5px",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                            }}
                        />
                    )}
                />
                <Divider />
                <List>
                    {conversations.map(conv => (
                        <ConversationListItem 
                            key={conv.id} 
                            conv={conv} 
                            onClick={() => handleSelectConversation(conv)}
                            username={conversationUsernames[conv.id] || "Loading..."}
                        />
                    ))}
                </List>
            </div>
            <div className="chat-window">
                {selectedConversation && otherUserProfile ? (
                    <Paper elevation={3} className="chat-paper">
                        <Typography variant="h6" className="chat-header">
                            {conversationUsernames[selectedConversation.id] || "Loading..."}
                        </Typography>
                        <MessageHistory 
                            messages={messages} 
                            currentUser={currentUser}
                            getProfileForUser={getProfileForUser}
                        />
                        <div className="message-input">
                            <Input fullWidth placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} />
                            <Button variant="contained" color="primary" onClick={handleSendMessage}>Send</Button>
                        </div>
                    </Paper>
                ) : (
                    <div className="no-chat-selected">
                        <Typography variant="h6">Select a conversation to start messaging</Typography>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
