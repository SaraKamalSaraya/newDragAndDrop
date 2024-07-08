import fs from 'fs'
import path from 'path'
import { Server } from 'ws'

let wsServer

export default function handler(req, res) {
  if (!wsServer) {
    wsServer = new Server({ noServer: true })
    const server = req.socket.server
    server.on('upgrade', (request, socket, head) => {
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request)
      })
    })

    const filePath = path.join(process.cwd(), 'data', 'default.html')

    fs.watch(filePath, (eventType, filename) => {
      if (filename && eventType === 'change') {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            console.error('Error reading file:', err)
            return
          }
          wsServer.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
              client.send(JSON.stringify({ html: data }))
            }
          })
        })
      }
    })
  }

  res.status(200).end()
}
