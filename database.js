var sql = require('mssql');

var connString = "mssql://admincommunity:Antonchristian95@communitylab.database.windows.net:1433/community?encrypt=true";

sql.connect(connString).then(function(err) {

}).catch(function(err){
    if(err)
        throw err;
});


var getConversationsById = function(userId, callback){

    var request = new sql.Request();

    var query = "SELECT conversation_id, namn "+
        "FROM User_Conversation "+
        "INNER JOIN Conversation "+
        "ON User_Conversation.convo_id = Conversation.conversation_id "+
        "INNER JOIN Usr "+
        "ON User_Conversation.user_id = Usr.user_id "+
        "WHERE User_Conversation.user_id = @userId";

    request.input('userId', sql.Int(), userId);

    request.query(query).then(function(recordset){
        callback(recordset);

    }).catch(function(err){
        console.log(err.message);
    });
};

var getMessagesFromConversation = function(convId, callback){

        var request = new sql.Request();

        var query = "SELECT * FROM Message WHERE receiver = @convId";

        request.input('convId', sql.Int(), convId);

        request.query(query).then(function(recordset){
            callback(recordset);

        }).catch(function(err){
            console.log(err.message);
        });
    };


var getFriendsByUser =function(userId, callback){
        var request = new sql.Request();

        var query = "SELECT u1.user_id, u1.name FROM Friendship "+
            "INNER JOIN Usr as u1 ON Friendship.receiver = u1.user_id "+
            "INNER JOIN Usr as u2 ON Friendship.inviter = u2.user_id "+
            "WHERE u2.user_id = @userId";

        var query2 = "SELECT u2.user_id, u2.name FROM Friendship "+
            "INNER JOIN Usr as u1 ON Friendship.receiver = u1.user_id "+
            "INNER JOIN Usr as u2 ON Friendship.inviter = u2.user_id "+
            "WHERE u1.user_id = @userId";

        request.input('userId', sql.Int(), userId);

        request.query(query).then(function(recordset){
            console.dir(recordset);
            request.query(query2).then(function(recordset2){

                var myArray = [];

                recordset.forEach(function(item, index){
                    myArray.push(item);
                });

                recordset2.forEach(function(item, index){
                    myArray.push(item);
                });

                callback(myArray);

            });

        }).catch(function(err){
            console.log(err.message);
        });
    };

var addNewConversation = function(members, name){
            var request = new sql.Request();

            var query = "INSERT INTO Conversation (namn) VALUES(@name);SELECT SCOPE_IDENTITY() AS id;";

            request.input('name', sql.VarChar(), name);

            request.query(query).then(function(recordset){

                console.dir(recordset[0].id);

                addMembersToConversation(recordset[0].id, members)

            }).catch(function(err){
                console.log(err.message);
            });
        };

var addMembersToConversation = function(convoId, members){

    var request = new sql.Request();

    var query = "INSERT INTO User_Conversation (user_id, convo_id) VALUES(@user, @convo);";


    members.forEach(function(item, index){
        request.input('convo', sql.Int(), convoId);
        request.input('user', sql.Int(), item);

        request.query(query).then(function(recordset){
        }).catch(function(err){
        });
    });

}

var saveMessageToDB = function( sender, receiver, text){
    var request = new sql.Request();

    var query = "INSERT INTO Message (sender, text, receiver) VALUES(@sender, @text, @receiver)";

    request.input('sender', sql.Int(),sender);
    request.input('receiver', sql.Int(),receiver);
    request.input('text', sql.VarChar(),text);

    request.query(query).then(function(recordset){
        console.log("saved message");
    }).catch(function(err){
        console.log("error");
        console.log(err.message);
    });

}

module.exports = {
    getConversationsById: getConversationsById,

    getMessagesFromConversation: getMessagesFromConversation,

    getFriendsByUser: getFriendsByUser,

    addNewConversation: addNewConversation,

    addMembersToConversation: addMembersToConversation,

    saveMessageToDB:saveMessageToDB
}


