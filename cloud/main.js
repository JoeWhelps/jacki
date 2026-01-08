Parse.Cloud.define("sendMessage", async (request) => {
    const { senderId, receiverId, content } = request.params;
    console.log("sendMessage called with:", { senderId, receiverId, content });

    try {
        const sender = new Parse.User();
        sender.id = senderId;
        await sender.fetch();

        const receiver = new Parse.User();
        receiver.id = receiverId;
        await receiver.fetch();

        const Profile = Parse.Object.extend("Profile");
        const senderProfileQuery = new Parse.Query(Profile);
        senderProfileQuery.equalTo("user", sender);
        const senderProfile = await senderProfileQuery.first();

        const receiverProfileQuery = new Parse.Query(Profile);
        receiverProfileQuery.equalTo("user", receiver);
        const receiverProfile = await receiverProfileQuery.first();

        if (!senderProfile || !receiverProfile) {
            throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, "Could not find profile for sender or receiver.");
        }

        let conversation;
        const query1 = new Parse.Query("Conversation");
        query1.equalTo("user1", senderProfile);
        query1.equalTo("user2", receiverProfile);

        const query2 = new Parse.Query("Conversation");
        query2.equalTo("user1", receiverProfile);
        query2.equalTo("user2", senderProfile);

        const mainQuery = Parse.Query.or(query1, query2);
        conversation = await mainQuery.first();
        console.log("Found conversation:", conversation);

        if (!conversation) {
            console.log("No conversation found, creating a new one.");
            const Conversation = Parse.Object.extend("Conversation");
            conversation = new Conversation();
            conversation.set("user1", senderProfile);
            conversation.set("user2", receiverProfile);
            await conversation.save();
            console.log("New conversation created:", conversation);
        }

        const Message = Parse.Object.extend("Message");
        const message = new Message();
        message.set("sender", sender);
        message.set("receiver", receiver);
        message.set("content", content);
        message.set("conversation", conversation);
        
        await message.save();
        console.log("Message saved:", message);

        conversation.set("lastMessage", message);
        await conversation.save();
        console.log("Conversation updated with last message.");

        return message;
    } catch (error) {
        console.error("Error in sendMessage Cloud Code:", error);
        throw new Parse.Error(Parse.Error.SCRIPT_FAILED, error.message);
    }
});
