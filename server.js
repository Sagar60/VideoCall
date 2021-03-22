const Socket = require("websocket").server
const http = require("http")
const express = require('express');
const app = express()
const path = require('path');

// this is how http to render a static file
 
// var nStatic = require('node-static');

// var fileServer = new nStatic.Server('./index');

const server = http.createServer((req, res) => {
    // fileServer.serve(req,res);

})

server.listen(3000, () => {
    console.log("Listening Http on port 3000...")
})

// app.set('view engine','ejs');
// app.engine('html', require('ejs').renderFile);

app.use(express.static(__dirname+ '' ))

app.get('/receiver',(req,res)=>{
    app.use(express.static(__dirname+ '/receiver' ))
    res.sendFile(path.join(__dirname, 'receiver', 'receiver.html'));
})

app.get('/sender',(req,res)=>{
    app.use(express.static(__dirname+ '/sender' ))
    res.sendFile(path.join(__dirname, 'sender', 'sender.html'));

})


const webSocket = new Socket({ httpServer: server })

let users = []

webSocket.on('request', (req) => {
    const connection = req.accept()

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)

        const user = findUser(data.username)

        switch(data.type) {
            case "store_user":

                if (user != null) {
                    return
                }

                const newUser = {
                     conn: connection,
                     username: data.username
                }

                users.push(newUser)
                console.log(newUser.username)
                break
            case "store_offer":
                if (user == null)
                    return
                user.offer = data.offer
                break
            
            case "store_candidate":
                if (user == null) {
                    return
                }
                if (user.candidates == null)
                    user.candidates = []
                
                user.candidates.push(data.candidate)
                break
            case "send_answer":
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break
            case "send_candidate":
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break
            case "join_call":
                if (user == null) {
                    return
                }

                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)
                
                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                })

                break
        }
    })

    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})

function sendData(data, conn) {
    conn.send(JSON.stringify(data))
}

function findUser(username) {
    for (let i = 0;i < users.length;i++) {
        if (users[i].username == username)
            return users[i]
    }
}
app.get('/*',function(req,res) {
    res.sendFile('index.html',{root: __dirname+ '/index'})
    // res.render('index/index')
})
app.listen( process.env.PORT || 8080,()=>{
	console.log('server started at 8080');
});
