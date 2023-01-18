(function () {
  var P1 = "X";
  var P2 = "O";
  var player;
  var game;
  var socket = io.connect("https://tic-tac-toe-game-r0qt.onrender.com/");

  $("#new").on("click", () => {
    var name = $(`#nameNew`).val();
    if (!name) {
      alert("Введите имя, пожалуйста");
      return;
    }
    socket.emit("createGame", { name: name });
    player = new Player(name, P1);
  });

  $("#join").on("click", () => {
    var name = $("#nameJoin").val();
    var room = $("#room").val();
    if (!name || !room) {
      alert("Ввдеите имя и ID комнаты");
      return;
    }
    socket.emit("joinGame", { name: name, room: room });
    player = new Player(name, P2);
  });

  /*класс Player */

  var Player = function (name, type) {
    this.name = name;
    this.type = type;
    this.currentTurn = true;
    this.movesPlayed = 0;
  };

  /* массив возможных комбинаций победы */

  Player.wins = [7, 56, 448, 73, 146, 292, 273, 84];

  Player.prototype.updateMovesPlayed = function (tileValue) {
    this.movesPlayed += tileValue;
  };

  Player.prototype.getMovesPlayed = function () {
    return this.movesPlayed;
  };

  Player.prototype.setCurrentTurn = function (turn) {
    this.currentTurn = turn;
    if (turn) {
      $("#turn").text("Ваш ход");
    } else {
      $("#turn").text("ждите ход соперника");
    }
  };

  Player.prototype.getPlayerName = function () {
    return this.name;
  };

  Player.prototype.getPlayerType = function () {
    return this.type;
  };

  Player.prototype.getCurrentTurn = function(){
    return this.currentTurn;
  }





  /*класс Game */


  var Game=function(roomId){
   this.roomId=roomId
   this.board=[]
   this.moves=0
  }


  Game.prototype.createGameBoard = function(){
    for(var i=0; i<3; i++) {
      this.board.push(['','','']);
      for(var j=0; j<3; j++) {
        $('#button_' + i + '' + j).on('click', function(){
          if(!player.getCurrentTurn()){
            alert('Сейчас не ваш ход!');
            return;
          }
  
          if($(this).prop('disabled'))
            alert('Эта клетка уже занята!');
  
          var row = parseInt(this.id.split('_')[1][0]);
          var col = parseInt(this.id.split('_')[1][1]);
  
          //Update board after your turn.
          game.playTurn(this);
          game.updateBoard(player.getPlayerType(), row, col, this.id);
  
          player.setCurrentTurn(false);
          player.updateMovesPlayed(1 << (row * 3 + col));
  
          game.checkWinner();
          return false;
        });
      }
    }
  }


  Game.prototype.displayBoard = function(message){
    $('.menu').css('display', 'none');
    $('.gameBoard').css('display', 'flex');
    $('#userHello').html(message);
    this.createGameBoard();
  }

  Game.prototype.updateBoard = function(type, row, col, tile){
    $('#'+tile).text(type);
    $('#'+tile).prop('disabled', true);
    this.board[row][col] = type;
    this.moves+=1;
    console.log(this.moves)
  }


  Game.prototype.getRoomId = function(){
    return this.roomId;
  }

  Game.prototype.playTurn = function(tile){
    var clickedTile = $(tile).attr('id');
    var turnObj = {
      tile: clickedTile,
      room: this.getRoomId()
    };
    // Emit an event to update other player that you've played your turn.
    socket.emit('playTurn', turnObj);
  }


  Game.prototype.checkWinner = function(){		
    var currentPlayerPositions = player.getMovesPlayed();
    Player.wins.forEach(function(winningPosition){
      // We're checking for every winning position if the player has achieved it.
      // Keep in mind that we are using a bitwise AND here not a logical one.PlaysArr
      if(winningPosition && currentPlayerPositions == winningPosition){
        game.announceWinner();
      }
    });
  
    var tied = this.checkTie();
    if(tied){
      socket.emit('gameEnded', {room: this.getRoomId(), message: 'Ничья :('});
      alert('Ничья :(');
      location.reload();	
    }
  }

  


  Game.prototype.checkTie = function(){
    return this.moves==9
  }

  Game.prototype.announceWinner = function(){
    var message = player.getPlayerName() + ' Выиграл!';
    socket.emit('gameEnded', {room: this.getRoomId(), message: message});
    alert(message);
    location.reload();
  }

  Game.prototype.endGame = function(message){
    alert(message);
    location.reload();
  }




  /*Настройка сокет ивентов */

  socket.on('newGame',(data)=>{
    var message="Привет, "+data.name+'. Попроси своего друга ввести ID комнаты: '+data.room+'. Ожидаем второго игрока...'

    game=new Game(data.room)
    game.displayBoard(message)
  })

  socket.on('player1', function(data){		
    var message = 'Привет, ' + player.getPlayerName();
    var color='#f95959'
    $('#userHello').html(message);
    $('.tile').css('color',color)
    player.setCurrentTurn(true);
  });

  socket.on('player2', function(data){
    var message = 'Привет, ' + data.name;
  
    game = new Game(data.room);
    game.displayBoard(message);
    player.setCurrentTurn(false);	
  });	

  socket.on('turnPlayed', function(data){
    var row = data.tile.split('_')[1][0];
    var col = data.tile.split('_')[1][1];
    var opponentType = player.getPlayerType() == P1 ? P2 : P1;
    game.updateBoard(opponentType, row, col, data.tile);
    player.setCurrentTurn(true);
  });

  socket.on('gameEnd', function(data){
    game.endGame(data.message);
    socket.leave(data.room);
  })

  socket.on('err', function(data){
    game.endGame(data.message);
  });
  
  
})();
