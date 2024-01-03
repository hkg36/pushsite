const express = require('express')
const winston = require('winston');
const compression = require('compression')
const app = express()
const expressWs = require('express-ws')(app);
const uuid=require('uuid')
const fs = require('node:fs');
const { parse } = require('node:path');

const port = 6001

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

function AddBroadcastRouter(path,keeplog=5){
app.post(path,async(req,res)=>{
  broadcastMessage(req.body)
  res.send("ok")
})
var log=[]
function addLog(data){
  log.push(data)
  if(log.length>keeplog){
    log.shift()
  }
}
var clients={}
function broadcastMessage(msg){
  addLog(msg)
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
    for(var msg of log){
      if(typeof(msg) != 'string')
          msg=JSON.stringify(msg)
      ws.send(msg)
    }
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
  var pathre = /\s*(?<path>[A-Za-z0-9_/]+)\s*(?<keeplog>\d+)?/i;
  for(let l of data.split("\n")){
    let p=pathre.exec(l)
    if(p){
      logger.info(`add path ${p.groups.path}`)
      if (typeof(p.groups.keeplog) == "undefined") p.groups.keeplog=5
      else p.groups.keeplog=parseInt(p.groups.keeplog)
      AddBroadcastRouter(p.groups.path,p.groups.keeplog)
    }
  }
} catch (err) {
  console.error(err);
}

app.listen(port,'0.0.0.0', () => {
  console.log(`listening on port ${port}`)
})