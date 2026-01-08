import Parse from "parse";

// Helper function to get Profile object for a User (Parse.User)
export const getProfileForUser = async (user) => {
    try {
        const Profile = Parse.Object.extend("Profile");
        const query = new Parse.Query(Profile);
        // Try "user" field first (as used in cloud code), fallback to "userId"
        console.log("Getting profile for user:", user);
        query.equalTo("user", user);
        let profile = await query.first();
        if (!profile) {
            // Try with "userId" as fallback
            const query2 = new Parse.Query(Profile);
            query2.equalTo("userId", user);
            profile = await query2.first();
        }
        return profile;
    } catch (error) {
        console.error("Error getting profile for user: ", error);
        return null;
    }
};

// Function to send a message directly using Parse (no cloud code)
// Now accepts Profile objects instead of User objects
export const sendMessage = async (senderProfile, receiverProfile, content) => {
    try {
        if (!senderProfile || !receiverProfile) {
            console.error("Sender or receiver profile is missing");
            return null;
        }

        // Find or create conversation using Profile objects
        let conversation = await findConversation(senderProfile, receiverProfile);
        if (!conversation) {
            conversation = await createConversation(senderProfile, receiverProfile);
            if (!conversation) {
                console.error("Failed to create conversation");
                return null;
            }
        }

        // Create the message - store Profile objects as sender/receiver
        const Message = Parse.Object.extend("Message");
        const message = new Message();
        message.set("sender", senderProfile);
        message.set("receiver", receiverProfile);
        message.set("content", content);
        message.set("conversation", conversation);
        
        await message.save();

        // Update conversation with last message
        conversation.set("lastMessage", message);
        await conversation.save();

        return message;
    } catch (error) {
        console.error("Error sending message: ", error);
        return null;
    }
};

// Function to find a conversation between two profiles
export const findConversation = async (profile1, profile2) => {
    try {
        const Conversation = Parse.Object.extend("Conversation");
        const query1 = new Parse.Query(Conversation);
        query1.equalTo("user1", profile1);
        query1.equalTo("user2", profile2);

        const query2 = new Parse.Query(Conversation);
        query2.equalTo("user1", profile2);
        query2.equalTo("user2", profile1);

        const mainQuery = Parse.Query.or(query1, query2);

        const conversation = await mainQuery.first();
        return conversation;
    } catch (error) {
        console.error("Error finding conversation: ", error);
        return null;
    }
};

// Function to create a new conversation using Profile objects
export const createConversation = async (profile1, profile2) => {
    try {
        const Conversation = Parse.Object.extend("Conversation");
        const conversation = new Conversation();
        conversation.set("user1", profile1);
        conversation.set("user2", profile2);

        await conversation.save();
        return conversation;
    } catch (error) {
        console.error("Error creating conversation: ", error);
        return null;
    }
};

// Function to get all conversations for a user (accepts Parse.User, gets Profile internally)
export const getConversations = async (user) => {
    try {
        // Get the user's profile
        const userProfile = await getProfileForUser(user);
        if (!userProfile) {
            console.error("Could not find profile for user");
            return [];
        }

        const Conversation = Parse.Object.extend("Conversation");
        const query1 = new Parse.Query(Conversation);
        query1.equalTo("user1", userProfile);

        const query2 = new Parse.Query(Conversation);
        query2.equalTo("user2", userProfile);

        const mainQuery = Parse.Query.or(query1, query2);
        mainQuery.include("lastMessage");
        mainQuery.include("user1");
        mainQuery.include("user2");
        // Include user references from profiles (try both field names)
        mainQuery.include("user1.user");
        mainQuery.include("user2.user");
        mainQuery.include("user1.userId");
        mainQuery.include("user2.userId");
        mainQuery.descending("updatedAt");

        const conversations = await mainQuery.find();
        return conversations;
    } catch (error) {
        console.error("Error getting conversations: ", error);
        return [];
    }
};

// Function to get all messages in a conversation
export const getMessages = async (conversation) => {
    try {
        const Message = Parse.Object.extend("Message");
        const query = new Parse.Query(Message);
        query.equalTo("conversation", conversation);
        query.include("sender");
        query.include("receiver");
        // Include user references from sender/receiver profiles
        query.include("sender.user");
        query.include("sender.userId");
        query.include("receiver.user");
        query.include("receiver.userId");
        query.ascending("createdAt");

        const messages = await query.find();
        return messages;
    } catch (error) {
        console.error("Error getting messages: ", error);
        return [];
    }
};

// Function to get a Profile by ID (replaces getUserById)
export const getProfileById = async (profileId) => {
    try {
        const Profile = Parse.Object.extend("Profile");
        const query = new Parse.Query(Profile);
        const profile = await query.get(profileId);
        return profile;
    } catch (error) {
        console.error("Error getting profile by ID: ", error);
        return null;
    }
};

// Helper function to get the other user's Profile from a conversation
export const getOtherUserFromConversation = async (conversation, currentUser) => {
    try {
        const user1Profile = conversation.get("user1");
        const user2Profile = conversation.get("user2");
        
        // Fetch the profiles
        console.log(user1Profile, user2Profile)
        await user1Profile.fetch();
        await user2Profile.fetch();
        
        // Get the user references to compare with currentUser
        let user1 = user1Profile.get("user");
        let user2 = user2Profile.get("user");
        
        if (!user1) user1 = user1Profile.get("userId");
        if (!user2) user2 = user2Profile.get("userId");
        
        // Fetch the users to compare IDs
        
        
        if (!user1 || !user2) {
            console.error("Could not get user references from profiles");
            return null;
        }
        
        console.log(user1, user2, currentUser);
        // Return the Profile object of the other user
        return user2Profile;
    } catch (error) {
        console.error("Error getting other user from conversation: ", error);
        return null;
    }
};

// Helper function to get username from a Profile
export const getUsernameFromProfile = async (profile) => {
    try {
        if (!profile) return null;
        
        await profile.fetch();
        
   
        // Fallback: check if username is directly on profile
        return profile.get("username");
    } catch (error) {
        console.error("Error getting username from profile: ", error);
        return null;
    }
};