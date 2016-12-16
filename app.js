var port = 8091;

var http = require('http');
var fs = require('fs');
var EventBus = require('eventbusjs');
var WebSocketServer = require('websocket').server;
var database = require('./database.js');

var httpServer = http.createServer(function(request, res){
    fs.readFile('web/live_chat.html', function(err, html){
        if(err){
            throw err;
        }

        console.log((new Date()) + ' received request for ' + request.url);
        res.writeHead(200, {'Content-Type': 'text/html','Content-Length':html.length});
        res.write(html);
        res.end();
    });

});

httpServer.listen(port, function(){
    console.log('Listening on port ' + port);
});

var wsServer = new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections:false
});

wsServer.on('request', function(request){
    var connection = request.accept('live-chat',request.origin);
    console.log((new Date()) + 'connection accepted.');

    var sendToClient = function(event, message){
        connection.sendUTF(message);
    }

    connection.on('message', function(message){
       if(message.type === 'utf8'){
           console.log('Data from client: ' + message.utf8Data);

           //handle message
           var msg = JSON.parse(message.utf8Data);

           switch(msg.type){
               case 'message':

                   database.saveMessageToDB(msg.sender, msg.id, msg.message);

                   EventBus.dispatch('chat.conversation.'+msg.id, this, JSON.stringify(msg));
                   break;
               case 'conversations':

                    database.getConversationsById(msg.user, function(result){
                        console.dir(result);

                        var response = {
                            type:'conversations',
                            conversations:result
                        };

                    connection.sendUTF(JSON.stringify(response));
                    });

                   break;
               case 'openConversation':
                   if(!EventBus.hasEventListener('chat.conversation.' + msg.id, sendToClient, this))
                   {
                       EventBus.addEventListener('chat.conversation.' + msg.id, sendToClient, this);
                   }

                   database.getMessagesFromConversation(msg.id, function(result){
                        var response = {
                            type:'messages',
                            messages:result
                        };
                        console.dir(response);
                        connection.sendUTF(JSON.stringify(response));
                   });

                   break;
               case 'new':
                   console.dir(msg);
                    database.addNewConversation(msg.members, msg.name, function(id, name){
                        var response = {
                            type:'newConversation',
                            namn:name,
                            conversation_id:id
                        }
                        connection.sendUTF(JSON.stringify(response));
                    });
                   break;

               case 'invite':

                   break;

               case 'friends':
                    database.getFriendsByUser(msg.id, function(result){
                        var response = {
                            type:'friends',
                            friends:result
                        }
                        console.log("result="+result);
                        connection.sendUTF(JSON.stringify(response));
                    });
                   break;

           }

       }
    });

    connection.on('close', function(reasonCode, description){
        console.log((new Date()) + 'Peer ' + connection.remoteAddress + ' disconnected.');
    });
});