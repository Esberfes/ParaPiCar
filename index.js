var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express = require('express');
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

var PythonShell = require('python-shell');
let fileName = "magneto.py";
let filePath = "/home/pi/server";



//GPIO VARS

//Lights
var LED = new Gpio(4, 'out'); 

//Left motor
var ml1 = new Gpio(19, 'out'); 
var ml2 = new Gpio(26, 'out'); 

//Right motor 
var mr1 = new Gpio(27, 'out'); 
var mr2 = new Gpio(17, 'out');

//GLOBAL SYNC VARIABLES
var lightvalue = false;
var left = false;
var right = false;
var backward = false;
var gas = false;

app.use(express.static(__dirname + '/includes'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket){

    io.emit('light', lightvalue);
    io.emit('left', left);
    io.emit('right', right);
    io.emit('forward', backward);
    io.emit('gas', gas);

    socket.on('light', function(msg){
        lightvalue = msg;
        console.log(LED.readSync());

        if ( Number(lightvalue) != LED.readSync()) { //only change LED if status has changed
            LED.writeSync(Number(lightvalue)); //turn LED on or off
        }
        io.emit('light', lightvalue);
    });

    socket.on('left', function(msg){
        left = msg;
        ml1.writeSync(0);
        ml2.writeSync(0);
        gas = false;

        if(left){
            if(backward){
                ml1.writeSync(1);
                ml2.writeSync(0);
            } else{
                ml1.writeSync(0);
                ml2.writeSync(1);
            }
        }

        io.emit('left', left);
        io.emit('gas', gas);
    });

    socket.on('right', function(msg){
        right = msg;
        mr1.writeSync(0);
        mr2.writeSync(0);
        gas = false;

        if(right){
            if(backward){
                mr1.writeSync(1);
                mr2.writeSync(0);
            } else{
                mr1.writeSync(0);
                mr2.writeSync(1);
            }
        }
        io.emit('right', right);
        io.emit('gas', gas);
    });

    socket.on('backward', function(msg){
        backward = msg;

        if(left == true){
            if(backward){
                ml1.writeSync(1);
                ml2.writeSync(0);
            } else{
                ml1.writeSync(0);
                ml2.writeSync(1);
            }
        }

        if(right){
            if(backward){
                mr1.writeSync(1);
                mr2.writeSync(0);
            } else{
                mr1.writeSync(0);
                mr2.writeSync(1);
            }
        }

        io.emit('backward', backward);
    });
    
    socket.on('gas', function(msg){
        gas = msg;

        if(gas){
            left = true;
            right = true;

            if(backward){
                ml1.writeSync(1);
                ml2.writeSync(0);
                mr1.writeSync(1);
                mr2.writeSync(0);
            } else{
                ml1.writeSync(0);
                ml2.writeSync(1);
                mr1.writeSync(0);
                mr2.writeSync(1);
            }
        }else {
            left = false;
            right = false;
            ml1.writeSync(0);
            ml2.writeSync(0);
            mr1.writeSync(0);
            mr2.writeSync(0);
        }

        io.emit('left', left);
        io.emit('right', left);
        io.emit('gas', gas);
    });

    setInterval(function(){ 
        PythonShell.run(fileName, { scriptPath: filePath }, function (err, results) {
            io.emit('position',  results);
            console.log(results);
        });
    }, 1000);

});

http.listen(8080, function(){
  console.log('listening on *:8080');
});

process.on('SIGINT', function () { //on ctrl+c
    LED.writeSync(0); // Turn LED off
    LED.unexport(); // Unexport LED GPIO to free resources
    process.exit(); //exit completely
});

/*
io.on('connection', function(socket){
    console.log('a user connected');

    socket.on('disconnect', function(){
      console.log('user disconnected');
    });

    var lightvalue = 0; 
    socket.on('light', function(data) { 
        lightvalue = data;
        console.log("Light: " + lightvalue);
        socket.emit('light', lightvalue);
    });

});
*/