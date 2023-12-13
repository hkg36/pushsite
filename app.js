const express = require('express')
const winston = require('winston');
const compression = require('compression')
const app = express()
const expressWs = require('express-ws')(app);
const uuid=require('uuid')
const fs = require('node:fs');

const port = 3010

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console()
  ],
});

app.use((req, res, next) => {
  req.logger=logger
  next()
})

app.use(compression())
app.use(express.json());
app.use(express.raw({limit: '16mb'}))
app.use(express.text())
app.use(express.urlencoded({ extended: true }))
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
    req.logger.info(`${id} connected: ${path}`)
    ws.on('close', function() {
        delete clients[id]
        req.logger.info(id+" disconnected")
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
    let p=l.trim()
    if(p!=""){
      logger.info(`add path ${p}`)
      AddBroadcastRouter(p)
    }
  }
} catch (err) {
  console.error(err);
}

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})