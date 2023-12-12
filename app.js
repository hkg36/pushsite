const express = require('express')
const app = express()
const expressWs = require('express-ws')(app);
const uuid=require('uuid')
const port = 3010

app.use(express.json());
app.use(express.static('public'))

function AddBroadcastRouter(path){
app.post(path,async(req,res)=>{
  broadcastMessage(req.body)
  res.send("ok")
})
var clients={}
function broadcastMessage(msg){
  if(typeof(msg) != 'string')
      msg=JSON.stringify(msg)
  for (const [key, value] of Object.entries(clients)) {
      value.send(msg)
  }
}
app.ws(path,async(ws,req)=>{
  var id=uuid.v4()
    clients[id]=ws
    console.log(id+" connected")
    ws.on('close', function() {
        delete clients[id]
        console.log(id+" disconnected")
    });
    ws.on('message', function(msg) {

    });
})
}
AddBroadcastRouter("/report/gp1")
app.listen(port, () => {
  console.log(`listening on port ${port}`)
})