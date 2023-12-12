const express = require('express')
const app = express()
const compression = require('compression')
const expressWs = require('express-ws')(app);
const uuid=require('uuid')
const fs = require('node:fs');

const port = 3010

app.use(compression())
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

try {
  let conffile="/usr/local/etc/pushsite/path.conf"
  if(!fs.existsSync(conffile)) conffile="path.conf"
  const data = fs.readFileSync(conffile, 'utf8');
  for(let l of data.split("\n")){
    AddBroadcastRouter(l.trim())
  }
} catch (err) {
  console.error(err);
}
app.listen(port, () => {
  console.log(`listening on port ${port}`)
})