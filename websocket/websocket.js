const {Server} = require('socket.io');

function make_server(httpServer) {
    const to_return = new Server(httpServer);

    to_return.on("connection", (socket) => {
        let channel = "";
        let userConnected = "";
        console.log("User connected.");
        // emit greeting message
        socket.send(`Hello! Please send any questions you may have to us!`);

        socket.on("message", (data) => {
            const recieved = data.toLowerCase();
            if (recieved.includes("who are")) {
                socket.send("I'm automated chatbot helper of komis.js instance. I would anwser all your questions about our service.");
            }
            else if (recieved.includes("email" || recieved.includes("e-mail"))) {
                socket.send("Our service supports e-mail notifications. If someone would follow your offer for example, you would be notified.")
            }
            else if (recieved.includes("map")) {
                socket.send("Our service fully supports geolocation. If you would ever give location of your offer, we automatically gonna change it to map coordinates and show it on fancy map.")
            }
            else if (recieved.includes("chat")) {
                socket.send("You're using it right now :). As you can see, we could have a nice talk and I can help you.")
            }
            else if (recieved.includes("offer")) {
                socket.send("Our offer system is wide and supports many attributes. You can also view pictures of cars and see their location.")
            }
            else {
                socket.send("Sorry, I can't understand you, could you repeat please?");
            }
        })
    })

    return to_return;
}


module.exports = {make_server};