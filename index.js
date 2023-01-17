const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const PORT=process.env.PORT || 3000



var rooms=0

app.use(express.static(__dirname+"/public"))

app.get('/', (req,res)=>{
    res.sendFile(__dirname+'/index.html')

    
    
})


io.on('connection',(socket)=>{
    console.log('Новый игрок подключился')



    socket.on('createGame',(data)=>{
        socket.join('room-'+ ++rooms)
        socket.emit('newGame',{name:data.name,room:'room-'+ rooms})
    })


    socket.on('joinGame',(data)=>{
        var room=io.nsps['/'].adapter.rooms[data.room]
        if(room&&room.length==1){
            socket.join(data.room)
            socket.broadcast.to(data.room).emit('player1',{})
            socket.emit('player2',{name:data.name, room:data.room})
        }
        else{
            socket.emit('err',{message:'Sorry, the room is fuul'})
        }
    })

    socket.on('playTurn',(data)=>{
        socket.broadcast.to(data.room).emit('turnPlayed',{tile:data.tile, room:data.room})
    })

    socket.on('gameEnded',(data)=>{
        socket.broadcast.to(data.room).emit('gameEnd',data)
    })
})









server.listen(PORT,()=>{
    console.log('Listening on port 3000')
})